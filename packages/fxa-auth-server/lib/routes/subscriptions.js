/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

const errors = require('../error');
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
        const { uid, client_id } = request.auth.credentials;

        const subs = await db.fetchAccountSubscriptions(uid);
        const capabilitiesForSubs = new Set(subs.reduce(
          (list, s) => list.concat(productCapabilities[s.productName] || []),
          []
        ));
        
        const capabilitiesForClient = new Set(clientCapabilities[client_id] || []);

        const capabilities = [];
        for (let c1 of capabilitiesForClient) {
          if (capabilitiesForSubs.has(c1)) {
            capabilities.push(c1);
          }
        }

        return capabilities;
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
        const plans = await subscriptionsBackend.listPlans();
        return plans;
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
        const sessionToken = request.auth.credentials;
        const planId = request.payload.plan_id;
        const token = request.payload.token;

        // Find the selected plan and get its product ID
        const plans = await subscriptionsBackend.listPlans();
        const selectedPlan = plans.filter(p => p.plan_id === planId)[0];
        if (!selectedPlan) { 
          // TODO: Throw an error on unknown plan id!
        }
        const productName = selectedPlan.product_id;

        // TODO: TBD from SubHub
        const paymentResult =
          await subscriptionsBackend.createSubscription(uid, token, planId);
        if (!paymentResult) {
          // TODO: Throw an error on backend subscription fail
        }
        const subscriptionId = paymentResult.sub_id;
        
        const dbResult = await db.createAccountSubscription({
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
        return { deleteSubs: true };
      }
    },
  ];
};
