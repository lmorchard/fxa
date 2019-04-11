/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

const error = require('../error');
const isA = require('joi');

module.exports = (log, db, config, customs, oauthdb, subscriptionsBackend) => {
  const {
    subscriptions: {
      productCapabilities = {},
      clientCapabilities = {}
    } = {}
  } = config;

  return [
    {
      // List subscription capabilities
      method: 'GET',
      path: '/subscriptions/capabilities',
      options: {
        auth: {
          strategies: [
            'sessionToken',
            'oauthToken'
          ]
        },
      },
      handler: async function (request) {
        log.begin('getSubscriptionCapabilities', request);
        // TODO: is this where to get client_id?
        const { uid, client_id } = request.auth.credentials;
        const capabilities = new Set();
        const capabilitiesForClient = clientCapabilities[client_id] || [];
        const subs = await db.fetchAccountSubscriptions(uid);
        for (const sub of subs) {
          const capabilitiesForProduct = productCapabilities[sub.productName] || [];
          for (const cap of capabilitiesForClient) {
            if (capabilitiesForProduct.includes(cap)) {
              capabilities.add(cap);
            }
          }
        }
        return Array.from(capabilities);
      }
    },

    {
      method: 'GET',
      path: '/subscriptions/plans',
      options: {
        auth: {
          strategy: 'sessionToken'
        },
      },
      handler: async function (request) {
        log.begin('getSubscriptionPlans', request);
        try {
          return subscriptionsBackend.listPlans();
        } catch (err) {
          throw error.backendServiceFailure();
        }
      }
    },

    {
      method: 'GET',
      path: '/subscriptions/active',
      options: {
        auth: {
          strategy: 'sessionToken'
        },
      },
      handler: async function (request) {
        log.begin('getSubscriptionsActive', request);
        const uid = request.auth.credentials.uid;
        const subs = await db.fetchAccountSubscriptions(uid);
        return subs;
      }
    },

    {
      method: 'POST',
      path: '/subscriptions/active',
      options: {
        auth: {
          strategy: 'sessionToken'
        },
        validate: {
          payload: {
            plan_id: isA.string().required(),
            token: isA.string().required()
          }
        },
        response: {
          schema: isA.object().keys({
            subscriptionId: isA.string().required()
          })
        }
      },
      handler: async function (request) {
        log.begin('createSubscription', request);

        const uid = request.auth.credentials.uid;
        const planId = request.payload.plan_id;
        const token = request.payload.token;

        let productName;
        try {
          // Find the selected plan and get its product ID
          const plans = await subscriptionsBackend.listPlans();
          const selectedPlan = plans.filter(p => p.plan_id === planId)[0];
          if (! selectedPlan) {
            throw error.unknownSubscriptionPlan();
          }
          productName = selectedPlan.product_id;
        } catch (err) {
          throw error.backendServiceFailure();
        }

        let subscriptionId;
        try {
          // TODO: TBD from SubHub
          const paymentResult =
            await subscriptionsBackend.createSubscription(uid, token, planId);
          if (! paymentResult) {
            throw error.rejectedSubscriptionPaymentToken();
          }
          subscriptionId = paymentResult.sub_id;
        } catch (err) {
          throw error.backendServiceFailure();
        }

        await db.createAccountSubscription({
          uid,
          subscriptionId,
          productName,
          createdAt: Date.now()
        });

        return { subscriptionId };
      }
    },

    {
      // Delete existing subscription
      method: 'DELETE',
      path: '/subscriptions/active/{subscriptionId}',
      options: {
        auth: {
          strategy: 'sessionToken'
        },
        validate: {
          params: {
            subscriptionId: isA.string()
          }
        }
      },
      handler: async function (request) {
        log.begin('deleteSubscription', request);
        const uid = request.auth.credentials.uid;
        const subscriptionId = request.params.subscriptionId;

        const subscription =
          await db.getAccountSubscription(uid, subscriptionId);
        if (! subscription) {
          throw error.unknownSubscription();
        }

        try {
          // TODO: TBD from SubHub
          await subscriptionsBackend.cancelSubscription(uid, subscriptionId);
        } catch (err) {
          throw error.backendServiceFailure();
        }

        await db.deleteAccountSubscription(uid, subscriptionId);

        return {};
      }
    },
  ];
};
