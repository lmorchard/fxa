import { createActions } from 'redux-actions';

/*
import {
  Store,
  AnyAction,
  Action,
  State,
  Selectors,
  ActionCreators,
  Plan,
} from './types';
*/

import { Action as ReduxAction } from 'redux';
import { ActionFunctionAny } from 'redux-actions';

import {
  apiGet,
  apiDelete,
  apiPost,
} from './utils';

import { config } from '../lib/config';

const RESET_PAYMENT_DELAY = 2000;

type ActionCreator = ActionFunctionAny<ReduxAction<Promise<any>>>;
type ActionCreators = {
  [actionName: string]: ActionCreator;
};
const actions: ActionCreators = createActions(
  {
    fetchProfile: accessToken =>
      apiGet(accessToken, `${config.servers.profile.url}/v1/profile`),
    fetchPlans: accessToken =>
      apiGet(
        accessToken,
        `${config.servers.auth.url}/v1/oauth/subscriptions/plans`
      ),
    fetchSubscriptions: accessToken =>
      apiGet(
        accessToken,
        `${config.servers.auth.url}/v1/oauth/subscriptions/active`
      ),
    fetchToken: accessToken =>
      apiPost(accessToken, `${config.servers.oauth.url}/v1/introspect`, {
        token: accessToken,
      }),
    fetchCustomer: accessToken =>
      apiGet(
        accessToken,
        `${config.servers.auth.url}/v1/oauth/subscriptions/customer`
      ),
    createSubscription: (accessToken, params) =>
      apiPost(
        accessToken,
        `${config.servers.auth.url}/v1/oauth/subscriptions/active`,
        params
      ),
    cancelSubscription: (accessToken, subscriptionId) =>
      apiDelete(
        accessToken,
        `${config.servers.auth.url}/v1/oauth/subscriptions/active/${subscriptionId}`
      ).then(result => {
        // HACK: cancellation response does not include subscriptionId, but we want it.
        return { ...result, subscriptionId };
      }),
    reactivateSubscription: async (accessToken, subscriptionId) =>
      apiPost(
        accessToken,
        `${config.servers.auth.url}/v1/oauth/subscriptions/reactivate`,
        { subscriptionId }
      ),
    updatePayment: (accessToken, { paymentToken }) =>
      apiPost(
        accessToken,
        `${config.servers.auth.url}/v1/oauth/subscriptions/updatePayment`,
        { paymentToken }
      ),
  },
  'updateApiData',
  'resetCreateSubscription',
  'resetCancelSubscription',
  'resetReactivateSubscription',
  'resetUpdatePayment'
);

// Convenience functions to produce action sequences via react-thunk functions
const thunkCreators = {
  fetchProductRouteResources: (accessToken: string) => async (
    dispatch: Function,
    getState: Function
  ) => {
    await Promise.all([
      dispatch(actions.fetchPlans(accessToken)),
      dispatch(actions.fetchProfile(accessToken)),
      dispatch(actions.fetchCustomer(accessToken)),
      dispatch(actions.fetchSubscriptions(accessToken)),
    ]);
  },

  fetchSubscriptionsRouteResources: (accessToken: string) => async (
    dispatch: Function,
    getState: Function
  ) => {
    await Promise.all([
      dispatch(actions.fetchPlans(accessToken)),
      dispatch(actions.fetchProfile(accessToken)),
      dispatch(actions.fetchCustomer(accessToken)),
      dispatch(actions.fetchSubscriptions(accessToken)),
    ]);
  },

  fetchCustomerAndSubscriptions: (accessToken: string) => async (
    dispatch: Function,
    getState: Function
  ) => {
    await Promise.all([
      dispatch(actions.fetchCustomer(accessToken)),
      dispatch(actions.fetchSubscriptions(accessToken)),
    ]);
  },

  createSubscriptionAndRefresh: (accessToken: string, params: object) => async (
    dispatch: Function,
    getState: Function
  ) => {
    await dispatch(actions.createSubscription(accessToken, params));
    await dispatch(actions.fetchCustomerAndSubscriptions(accessToken));
  },

  cancelSubscriptionAndRefresh: (
    accessToken: string,
    subscriptionId: object
  ) => async (dispatch: Function, getState: Function) => {
    await dispatch(actions.cancelSubscription(accessToken, subscriptionId));
    await dispatch(actions.fetchCustomerAndSubscriptions(accessToken));
  },

  reactivateSubscriptionAndRefresh: (
    accessToken: string,
    subscriptionId: object
  ) => async (dispatch: Function, getState: Function) => {
    await dispatch(actions.reactivateSubscription(accessToken, subscriptionId));
    await dispatch(actions.fetchCustomerAndSubscriptions(accessToken));
  },

  updatePaymentAndRefresh: (accessToken: string, params: object) => async (
    dispatch: Function,
    getState: Function
  ) => {
    await dispatch(actions.updatePayment(accessToken, params));
    await dispatch(actions.fetchCustomerAndSubscriptions(accessToken));
    setTimeout(
      () => dispatch(actions.resetUpdatePayment()),
      RESET_PAYMENT_DELAY
    );
  },
};

export default {
  ...actions,
  ...thunkCreators,
};
