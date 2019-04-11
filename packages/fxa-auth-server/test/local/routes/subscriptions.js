/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

const sinon = require('sinon');
const assert = { ...sinon.assert, ...require('chai').assert };
const getRoute = require('../../routes_helpers').getRoute;
const mocks = require('../../mocks');
const error = require('../../../lib/error');
const P = require('../../../lib/promise');

let config, log, db, customs, oauthdb, subscriptionsBackend, routes, route, request, requestOptions;

const TEST_EMAIL = 'test@email.com';
const UID = 'uid';
const MOCK_CLIENT_ID = '0123456789ABCDEF';
const NOW = Date.now();
const PLANS = [
  {
    plan_id: 'firefox_pro_basic_823',
    product_id: 'firefox_pro_basic',
    interval: 'month',
    amount: '123',
    currency: 'usd'
  },
  {
    plan_id: 'firefox_pro_basic_999',
    product_id: 'firefox_pro_pro',
    interval: 'month',
    amount: '456',
    currency: 'usd'
  }
];
const SUBSCRIPTION_ID_1 = 'sub-8675309';
const PAYMENT_TOKEN_VALID = '8675309-foobarbaz';
const PAYMENT_TOKEN_NEW = 'new-8675309';
const PAYMENT_TOKEN_BAD = 'thisisabadtoken';
const ACTIVE_SUBSCRIPTIONS = [
  {
    uid: UID,
    subscriptionId: SUBSCRIPTION_ID_1,
    productName: PLANS[0].product_id,
    createdAt: NOW,
  }
];

function runTest(routePath, requestOptions) {
  routes = require('../../../lib/routes/subscriptions')(
    log, db, config, customs, oauthdb, subscriptionsBackend
  );
  route = getRoute(routes, routePath, requestOptions.method || 'GET');
  request = mocks.mockRequest(requestOptions);
  request.emitMetricsEvent = sinon.spy(() => P.resolve({}));

  return route.handler(request);
}

describe('subscriptions', () => {
  beforeEach(() => {
    config = {
      'subscriptions': {
        'productCapabilities': {
          'Prod1': [ 'Cap1', 'Cap2', 'Cap3' ],
          'Prod2': [ 'Cap3', 'Cap4', 'Cap5' ],
          'Prod3': [ 'Cap1', 'Cap2', 'Cap3', 'Cap4', 'Cap5', 'Cap6', 'Cap7' ]
        },
        'clientCapabilities': {
          'dcdb5ae7add825d2': [ 'Cap0', 'Cap1', 'Cap3', 'Cap5', 'Cap6' ],
        }
      }
    };
    
    log = mocks.mockLog();
    customs = mocks.mockCustoms();
    
    db = mocks.mockDB({
      uid: UID,
      email: TEST_EMAIL
    });
    db.createAccountSubscription = sinon.spy(async (data) => ({}));
    db.deleteAccountSubscription = sinon.spy(
      async (uid, subscriptionId) => ({})
    );
    db.fetchAccountSubscriptions = sinon.spy(
      async (uid) => ACTIVE_SUBSCRIPTIONS
        .filter(s => s.uid === uid)
    );
    db.getAccountSubscription = sinon.spy(
      async (uid, subscriptionId) => ACTIVE_SUBSCRIPTIONS
        .filter(s => s.uid === uid && s.subscriptionId === subscriptionId)[0]
    );

    oauthdb = mocks.mockOAuthDB({
      getClientInfo: sinon.spy(async () => {
        return { id: MOCK_CLIENT_ID, name: 'mock client' };
      })
    });
    
    subscriptionsBackend = mocks.mockSubscriptionsBackend({
      listPlans: sinon.spy(async () => PLANS),
      createSubscription: sinon.spy(
        async (uid, token, plan_id) => ({ sub_id: SUBSCRIPTION_ID_1 })
      ),
      cancelSubscription: sinon.spy(
        async (uid, subscriptionId) => true
      ),
      updateCustomer: sinon.spy(async (uid, token) =>
        (token === PAYMENT_TOKEN_VALID || token === PAYMENT_TOKEN_NEW) ? {} : null)
    });
    
    requestOptions = {
      metricsContext: mocks.mockMetricsContext(),
      credentials: {
        uid: UID,
        email: TEST_EMAIL
      },
      log: log,
      payload: {
        metricsContext: {
          flowBeginTime: Date.now(),
          flowId: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
        }
      }
    };
  });

  describe('GET /subscriptions/capabilities', () => {
    it('should report subscription capabilities for client', async () => {
      const clientId = 'dcdb5ae7add825d2';
      const subscriptions = [ 'Prod1', 'Prod2', 'Prod4']
        .map(productName => ({ productName }));
      const expectedCapabilities = [ 'Cap1', 'Cap3', 'Cap5' ];

      db.fetchAccountSubscriptions = sinon.spy(async (uid) => subscriptions);

      const res = await runTest(
        '/subscriptions/capabilities',
        {
          ...requestOptions,
          credentials: {
            ...requestOptions.credentials,
            client_id: clientId
          }
        }
      );

      assert.equal(db.fetchAccountSubscriptions.callCount, 1);
      assert.equal(db.fetchAccountSubscriptions.args[0][0], UID);
      assert.deepEqual(res, expectedCapabilities);
    });
  });

  describe('GET /subscriptions/plans', () => {
    it('should list available subscription plans', async () => {
      const res = await runTest('/subscriptions/plans', requestOptions);
      assert.equal(subscriptionsBackend.listPlans.callCount, 1);
      assert.deepEqual(res, PLANS);
    });

    it('should correctly handle payment backend failure', async () => {
      subscriptionsBackend.listPlans =
        sinon.spy(async () => { throw 'PANIC'; });
      try {
        await runTest('/subscriptions/plans', requestOptions);
        assert.fail();
      } catch (err) {
        assert.equal(err.errno, error.ERRNO.BACKEND_SERVICE_FAILURE);
      }
    });
  });

  describe('GET /subscriptions/active', () => {
    it('should list active subscriptions', async () => {
      const res = await runTest('/subscriptions/active', requestOptions);
      assert.equal(db.fetchAccountSubscriptions.callCount, 1);
      assert.equal(db.fetchAccountSubscriptions.args[0][0], UID);
      assert.deepEqual(res, ACTIVE_SUBSCRIPTIONS);
    });
  });

  describe('POST /subscriptions/active', () => {
    it('should support creation of a new subscription', async () => {
      const res = await runTest(
        '/subscriptions/active',
        {
          ...requestOptions,
          method: 'POST',
          payload: {
            ...requestOptions.payload,
            plan_id: PLANS[0].plan_id,
            token: PAYMENT_TOKEN_VALID,
          },
        }
      );

      assert.equal(subscriptionsBackend.listPlans.callCount, 1);
      assert.deepEqual(
        subscriptionsBackend.createSubscription.args,
        [
          [ UID, PAYMENT_TOKEN_VALID, PLANS[0].plan_id ]
        ]
      );
      assert.equal(db.createAccountSubscription.callCount, 1);

      const createArgs = db.createAccountSubscription.args[0][0];
      assert.deepEqual(
        createArgs,
        {
          uid: UID,
          subscriptionId: SUBSCRIPTION_ID_1,
          productName: PLANS[0].product_id,
          createdAt: createArgs.createdAt
        }
      );
      assert.deepEqual(
        res,
        { subscriptionId: SUBSCRIPTION_ID_1 }
      );
    });

    it('should correctly handle payment backend failure on listing plans', async () => {
      subscriptionsBackend.listPlans =
        sinon.spy(async () => { throw 'PANIC'; });
      try {
        await runTest(
          '/subscriptions/active',
          {
            ...requestOptions,
            method: 'POST',
            payload: {
              ...requestOptions.payload,
              plan_id: PLANS[0].plan_id,
              token: PAYMENT_TOKEN_VALID,
            },
          }
        );
        assert.fail();
      } catch (err) {
        assert.deepEqual(err.errno, error.ERRNO.BACKEND_SERVICE_FAILURE);
        assert.equal(subscriptionsBackend.createSubscription.callCount, 0);
        assert.equal(db.createAccountSubscription.callCount, 0);
      }
    });

    it('should correctly handle payment backend failure on create', async () => {
      subscriptionsBackend.createSubscription =
        sinon.spy(async (uid, token, plan_id) => { throw 'PANIC'; });
      try {
        await runTest(
          '/subscriptions/active',
          {
            ...requestOptions,
            method: 'POST',
            payload: {
              ...requestOptions.payload,
              plan_id: PLANS[0].plan_id,
              token: PAYMENT_TOKEN_VALID,
            },
          }
        );
        assert.fail();
      } catch (err) {
        assert.deepEqual(err.errno, error.ERRNO.BACKEND_SERVICE_FAILURE);
        assert.equal(db.createAccountSubscription.callCount, 0);
      }
    });

    it('should correctly handle an unknown plan', async () => {
      try {
        await runTest(
          '/subscriptions/active',
          {
            ...requestOptions,
            method: 'POST',
            payload: {
              ...requestOptions.payload,
              plan_id: 'thisisnotaplan',
              token: PAYMENT_TOKEN_VALID,
            },
          }
        );
        assert.fail();
      } catch (err) {
        assert.deepEqual(err.errno, error.ERRNO.UNKNOWN_SUBSCRIPTION_PLAN);
        assert.equal(db.createAccountSubscription.callCount, 0);
      }
    });

    it('should correctly handle payment token rejection', async () => {
      subscriptionsBackend.createSubscription =
        sinon.spy(async (uid, token, plan_id) => null);
      try {
        await runTest(
          '/subscriptions/active',
          {
            ...requestOptions,
            method: 'POST',
            payload: {
              ...requestOptions.payload,
              plan_id: PLANS[0].plan_id,
              token: PAYMENT_TOKEN_VALID,
            },
          }
        );
        assert.fail();
      } catch (err) {
        assert.equal(err.errno, error.ERRNO.REJECTED_SUBSCRIPTION_PAYMENT_TOKEN);
        assert.equal(db.createAccountSubscription.callCount, 0);
      }
    });
  });

  describe('POST /subscriptions/updatePayment', () => {
    it('should allow updating of payment method', async () => {
      const res = await runTest(
        '/subscriptions/updatePayment',
        {
          ...requestOptions,
          method: "POST",
          payload: { token: PAYMENT_TOKEN_NEW }
        }
      );
      assert.deepEqual(
        subscriptionsBackend.updateCustomer.args,
        [ [ UID, PAYMENT_TOKEN_NEW ] ]
      );
    });

    it('should correctly handle subscription backend failure', async () => {
      subscriptionsBackend.updateCustomer =
        sinon.spy(async (uid, token) => { throw 'PANIC'; });
      try {
        const res = await runTest(
          '/subscriptions/updatePayment',
          {
            ...requestOptions,
            method: "POST",
            payload: { token: PAYMENT_TOKEN_NEW }
          }
        );
        assert.fail();
      } catch (err) {
        assert.deepEqual(err.errno, error.ERRNO.BACKEND_SERVICE_FAILURE);
        assert.equal(db.createAccountSubscription.callCount, 0);
      }
    });

    it('should correctly handle payment token rejection', async () => {
      try {
        const res = await runTest(
          '/subscriptions/updatePayment',
          {
            ...requestOptions,
            method: "POST",
            payload: { token: PAYMENT_TOKEN_BAD }
          }
        );
        assert.fail();
      } catch (err) {
        assert.deepEqual(
          subscriptionsBackend.updateCustomer.args,
          [ [ UID, PAYMENT_TOKEN_BAD ] ]
        );
        assert.equal(err.errno, error.ERRNO.REJECTED_SUBSCRIPTION_PAYMENT_TOKEN);
      }
    });
  });

  describe('DELETE /subscriptions/active/{subscriptionId}', () => {
    it('should support cancellation of an existing subscription', async () => {
      const res = await runTest(
        '/subscriptions/active/{subscriptionId}',
        {
          ...requestOptions,
          method: 'DELETE',
          params: { subscriptionId: SUBSCRIPTION_ID_1 }
        }
      );
      assert.deepEqual(
        subscriptionsBackend.cancelSubscription.args,
        [ [ UID, SUBSCRIPTION_ID_1 ] ]
      );
      assert.deepEqual(
        db.deleteAccountSubscription.args,
        [ [ UID, SUBSCRIPTION_ID_1 ] ]
      );
      assert.deepEqual( res, {});
    });

    it('should report error for unknown subscription', async () => {
      const badSub = 'notasub';
      try {
        await runTest(
          '/subscriptions/active/{subscriptionId}',
          {
            ...requestOptions,
            method: 'DELETE',
            params: { subscriptionId: badSub }
          }
        );
        assert.fail();
      } catch (err) {
        assert.deepEqual(db.getAccountSubscription.args, [ [ UID, badSub ] ]);
        assert.deepEqual(subscriptionsBackend.cancelSubscription.args, []);
        assert.deepEqual(db.deleteAccountSubscription.args, []);
        assert.deepEqual(err.errno, error.ERRNO.UNKNOWN_SUBSCRIPTION);
      }
    });

    it('should not delete subscription from DB after payment backend failure', async () => {
      subscriptionsBackend.cancelSubscription = sinon.spy(
        async (uid, subscriptionId) => { throw 'PANIC'; }
      );
      try {
        await runTest(
          '/subscriptions/active/{subscriptionId}',
          {
            ...requestOptions,
            method: 'DELETE',
            params: { subscriptionId: SUBSCRIPTION_ID_1 }
          }
        );
        assert.fail();
      } catch (err) {
        assert.deepEqual(db.getAccountSubscription.args,
          [ [ UID, SUBSCRIPTION_ID_1 ] ]);
        assert.deepEqual(subscriptionsBackend.cancelSubscription.args,
          [ [ UID, SUBSCRIPTION_ID_1 ] ]);
        assert.deepEqual(db.deleteAccountSubscription.args, []);
        assert.deepEqual(err.errno,
          error.ERRNO.BACKEND_SERVICE_FAILURE);
      }
    });
  });
});
