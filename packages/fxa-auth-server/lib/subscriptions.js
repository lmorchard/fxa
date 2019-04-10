/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

const isA = require('joi');
const error = require('./error');
const createBackendServiceAPI = require('./backendService');

/*
 * The subscriptions backend is called "SubHub", a service managed outside the
 * FxA team to abstract away some details of payments processing.
 *
 * This library implements a little proxy in front of the SubHub API, allowing
 * it to be authenticated by FxA's bearer token.
 */

// TODO: Flesh out dummy stubs with real calls to SubHub when it's ready to use

module.exports = function (log, config) {

  /*
  const SubHubAPI = createBackendServiceAPI(log, config, 'subhub', {

  });

  const api = new SubHubAPI(config.subhub.url, {
    headers: {Authorization: `FxA-Server-Key ${config.subhub.key}`},
    timeout: 15000
  });
  */
  
  return {
    async listPlans() {
      const dummyPlans = [
        {
          plan_id: "firefox_pro_basic_823",
          product_id: "firefox_pro_basic",
          interval: "month",
          amount: "123",
          currency: "usd"
        }
      ];
      return dummyPlans;
    },

    async createSubscription(uid, token, plan_id) {
    },

    async getCustomer(uid) {
    },

    async updateCustomer(uid, token) {
    },

    async listSubscriptions(uid) {
    },

    async cancelSubscription(uid, subscriptionId) {
    }
  }
};
