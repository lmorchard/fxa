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
        const capabilitiesToReveal = new Set();
        const clientVisibleCapabilities = clientCapabilities[client_id] || [];
        const subscriptions = await db.fetchAccountSubscriptions(uid);
        for (const subscription of subscriptions) {
          const capabilitiesFromProduct =
            productCapabilities[subscription.productName] || [];
          for (const capability of clientVisibleCapabilities) {
            if (capabilitiesFromProduct.includes(capability)) {
              capabilitiesToReveal.add(capability);
            }
          }
        }
        return Array.from(capabilitiesToReveal);
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
          const plans = await subscriptionsBackend.listPlans();
          return plans;
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

        // Find the selected plan and get its product ID
        let plans;
        try {
          plans = await subscriptionsBackend.listPlans();
        } catch (err) {
          throw error.backendServiceFailure();
        }
        const selectedPlan = plans.filter(p => p.plan_id === planId)[0];
        if (! selectedPlan) {
          throw error.unknownSubscriptionPlan();
        }
        const productName = selectedPlan.product_id;

        let paymentResult;
        try {
          // TODO: TBD from SubHub
          paymentResult = await subscriptionsBackend.createSubscription(uid, token, planId);
        } catch (err) {
          throw error.backendServiceFailure();
        }

        // TODO: TBD what token rejection looks like from SubHub as distinct from service failure
        if (! paymentResult) {
          throw error.rejectedSubscriptionPaymentToken();
        }
        const subscriptionId = paymentResult.sub_id;

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
      method: 'POST',
      path: '/subscriptions/updatePayment',
      options: {
        auth: {
          strategy: 'sessionToken'
        },
        validate: {
          payload: {
            token: isA.string().required()
          }
        }
      },
      handler: async function (request) {
        log.begin('updateSubscriptionPayment', request);
        const uid = request.auth.credentials.uid;
        const token = request.payload.token;

        let paymentResult;
        try {
          // TODO: TBD from SubHub
          paymentResult = await subscriptionsBackend.updateCustomer(uid, token);
        } catch (err) {
          throw error.backendServiceFailure();
        }

        // TODO: TBD what token rejection looks like from SubHub as distinct from service failure
        if (! paymentResult) {
          throw error.rejectedSubscriptionPaymentToken();
        }

        return {};
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
