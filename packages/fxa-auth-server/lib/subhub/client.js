/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

const isA = require('joi');
const error = require('../error');
const createBackendServiceAPI = require('../backendService');
const { buildStubAPI } = require('./stubAPI');

/*
 * The subscriptions backend is called 'SubHub', a service managed outside the
 * FxA team to abstract away some details of payments processing.
 *
 * This library implements a little proxy in front of the SubHub API, allowing
 * it to be authenticated by FxA's bearer token.
 */

module.exports = function (log, config) {
  if (config.subhub.useStubs) {
    // TODO: Remove this someday after subhub is available
    return buildStubAPI(log, config);
  }

  if (! config.subhub.enabled) {
    return [
      'listPlans',
      'listSubscriptions',
      'createSubscription',
      'getCustomer',
      'updateCustomer',
      'cancelSubscription',
    ].reduce((obj, name) => ({
      ...obj,
      [ name ]: () => Promise.reject(error.featureNotEnabled())
    }), {});
  }

  const SubHubAPI = createBackendServiceAPI(log, config, 'subhub', {
    listPlans: {
      path: '/v1/plans',
      method: 'GET',
      validate: {
        // TODO: update with final plans schema from subhub
        response: isA.array().items(isA.object({
          plan_id: isA.string().required(),
          product_id: isA.string().required(),
          interval: isA.string().required(),
          amount: isA.number().required(),
          currency: isA.string().required(),
          nickname: isA.string().required()
        }))
      }
    },

    listSubscriptions: {
      path: '/v1/customer/:uid/subscriptions',
      method: 'GET',
      validate: {
        params: {
          uid: isA.string().required(),
        },
        // TODO: update with final subscriptions schema from subhub
        response: isA.array().items(isA.object({
          plan_id: isA.string().required(),
          product_id: isA.string().required(),
          current_period_end: isA.number().required(),
          end_at: isA.number().required(),
        }))
      }
    },

    getCustomer: {
      path: '/v1/customer/:uid',
      method: 'GET',
      validate: {
        params: {
          uid: isA.string().required(),
        },
        // TODO: update with final customer schema from subhub
        response: isA.object()
      }
    },

    updateCustomer: {
      path: '/v1/customer/:uid',
      method: 'POST',
      validate: {
        params: {
          uid: isA.string().required(),
        },
        payload: {
          pmt_token: isA.string().required(),
        },
        response: isA.alternatives(
          // TODO: update with final customer schema from subhub
          isA.object(),
          isA.object({
            message: isA.string()
          })
        )
      }
    },

    createSubscription: {
      path: '/v1/customer/:uid/subscriptions',
      method: 'POST',
      validate: {
        params: {
          uid: isA.string().required(),
        },
        payload: {
          pmt_token: isA.string().required(),
          plan_id: isA.string().required(),
          email: isA.string().required(),
        },
        response: isA.alternatives(
          isA.object({
            sub_id: isA.string()
          }),
          isA.object({
            message: isA.string()
          })
        )
      }
    },

    cancelSubscription: {
      path: '/v1/customer/:uid/subscriptions/:sub_id',
      method: 'DELETE',
      validate: {
        params: {
          uid: isA.string().required(),
          sub_id: isA.string().required(),
        },
        response: isA.alternatives(
          isA.object({}),
          isA.object({
            message: isA.string()
          })
        )
      }
    },

  });

  const api = new SubHubAPI(
    config.subhub.url,
    {
      headers: {
        // TODO: update with subhub final auth
        Authorization: `${config.subhub.key}`
      },
      timeout: 15000
    }
  );

  return {
    isStubAPI: false,

    async listPlans() {
      return api.listPlans();
    },

    async listSubscriptions(uid) {
      try {
        return await api.listSubscriptions(uid);
      } catch (err) {
        if (err.statusCode === 404) {
          log.error('subhub.listSubscriptions.1', { uid, err });
          // TODO: update with subhub listSubscriptions error response for invalid uid
          if (err.message === 'invalid uid') {
            throw error.unknownCustomer(uid);
          }
        }
        throw err;
      }
    },

    async createSubscription(uid, pmt_token, plan_id, email) {
      try {
        return await api.createSubscription(uid, { pmt_token, plan_id, email });
      } catch (err) {
        if (err.statusCode === 400) {
          log.error('subhub.createSubscription.1', { uid, pmt_token, plan_id, email, err });
          // TODO: update with subhub createSubscription error response for invalid payment token
          if (err.message === 'invalid payment token') {
            throw error.rejectedSubscriptionPaymentToken(pmt_token);
          }
          // TODO: update with subhub createSubscription error response for invalid plan ID
          if (err.message === 'invalid plan id') {
            throw error.unknownSubscriptionPlan(plan_id);
          }
        }
        throw err;
      }
    },

    async cancelSubscription(uid, sub_id) {
      try {
        return await api.cancelSubscription(uid, sub_id);
      } catch (err) {
        if (err.statusCode === 400 || err.statusCode === 404) {
          log.error('subhub.cancelSubscription.1', { uid, sub_id, err });
          // TODO: update with subhub cancelSubscription error response for invalid uid
          if (err.message === 'invalid uid') {
            throw error.unknownCustomer(uid);
          }
          // TODO: update with subhub cancelSubscription error response for invalid plan ID
          if (err.message === 'invalid subscription id') {
            throw error.unknownSubscription(sub_id);
          }
        }
        throw err;
      }
    },

    async getCustomer(uid) {
      try {
        return await api.getCustomer(uid);
      } catch (err) {
        if (err.statusCode === 404) {
          log.error('subhub.getCustomer.1', { uid, err });
          throw error.unknownCustomer(uid);
        }
        throw err;
      }
    },

    async updateCustomer(uid, pmt_token) {
      try {
        return await api.updateCustomer(uid, { pmt_token });
      } catch (err) {
        if (err.statusCode === 400 || err.statusCode === 404) {
          log.error('subhub.updateCustomer.1', { uid, pmt_token, err });
          // TODO: update with subhub createSubscription error response for invalid uid
          if (err.message === 'invalid uid') {
            throw error.unknownCustomer(uid);
          }
          // TODO: update with subhub updateCustomer error response for invalid payment token
          if (err.message === 'invalid payment token') {
            throw error.rejectedSubscriptionPaymentToken(pmt_token);
          }
        }
        throw err;
      }
    },
  };
};
