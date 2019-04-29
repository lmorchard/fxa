import { createStore, combineReducers, compose, applyMiddleware } from 'redux';
import { createActions } from 'redux-actions';
import ReduxThunk from 'redux-thunk';
import { createPromise as promiseMiddleware } from 'redux-promise-middleware';
import typeToReducer from 'type-to-reducer';

import config from '../config';
import {
  apiGet,
  apiDelete,
  apiPost,
  fetchDefault,
  fetchReducer,
  setStatic,
  mapToObject,
} from './utils';

export const defaultState = {
  api: {
    cancelSubscription: fetchDefault(false),
    createSubscription: fetchDefault(false),
    plans: fetchDefault([]),
    profile: fetchDefault({}),
    subscriptions: fetchDefault([]),
    token: fetchDefault({}),
  },
  ui: {
  },
};

export const selectors = {
  profile: state => state.api.profile,
  token: state => state.api.token,
  subscriptions: state => state.api.subscriptions,
  plans: state => state.api.plans,
  createSubscriptionStatus: state => state.api.createSubscription,
  cancelSubscriptionStatus: state => state.api.cancelSubscription,

  lastError: state => Object
    .entries(state.api)
    .filter(([k, v]) => v && !! v.error)
    .map(([k, v]) => [k, v.error])[0],

  isLoading: state => Object
    .values(state.api)
    .some(v => v && !! v.loading),

  products: state => {
    const plans = selectors.plans(state).result || [];
    return Array.from(new Set(plans.map(plan => plan.product_id)));
  },

  plansByProductId: state => productId => {
    const plans = selectors.plans(state).result || [];
    return productId
      ? plans.filter(plan => plan.product_id === productId)
      : plans;
  }
};

export const selectorsFromState = (...names) => state =>
  mapToObject(names, name => selectors[name](state));

export const actions = {
  ...createActions(
    {
      fetchProfile: accessToken =>
        apiGet(accessToken, `${config.PROFILE_API_ROOT}/profile`),
      fetchPlans: accessToken =>
        apiGet(accessToken, `${config.AUTH_API_ROOT}/oauth/subscriptions/plans`),
      fetchSubscriptions: accessToken =>
        apiGet(accessToken, `${config.AUTH_API_ROOT}/oauth/subscriptions/active`),
      fetchToken: accessToken =>
        apiPost(accessToken, `${config.OAUTH_API_ROOT}/introspect`, { token: accessToken }),
      createSubscription: (accessToken, params) =>
        apiPost(
          accessToken,
          `${config.AUTH_API_ROOT}/oauth/subscriptions/active`,
          params
        ),
      cancelSubscription: (accessToken, subscriptionId) =>
        apiDelete(
          accessToken,
          `${config.AUTH_API_ROOT}/oauth/subscriptions/active/${subscriptionId}`
        )
    },
    'updateApiData',
    'resetCreateSubscription',
    'resetCancelSubscription',
  ),

  // Convenience methods to produce action sequence thunks.

  createSubscriptionAndRefresh: (accessToken, params) => (dispatch, getState) => {
    dispatch(actions.createSubscription(accessToken, params))
      .then(() => dispatch(actions.fetchSubscriptions(accessToken)));
  },

  cancelSubscriptionAndRefresh: (accessToken, subscriptionId) => (dispatch, getState) => {
    dispatch(actions.cancelSubscription(accessToken, subscriptionId))
      .then(() => dispatch(actions.fetchSubscriptions(accessToken)));
  },
};

export const pickActions = (...names) => mapToObject(names, name => actions[name]);

export const reducers = {
  api: typeToReducer(
    {
      [actions.fetchProfile]: fetchReducer('profile'),
      [actions.fetchPlans]: fetchReducer('plans'),
      [actions.fetchSubscriptions]: fetchReducer('subscriptions'),
      [actions.fetchToken]: fetchReducer('token'),
      [actions.createSubscription]: fetchReducer('createSubscription'),
      [actions.cancelSubscription]: fetchReducer('cancelSubscription'),
      [actions.updateApiData]: (state, { payload }) => ({ ...state, ...payload }),
      [actions.resetCreateSubscription]: setStatic({ createSubscription: fetchDefault(false) }),
      [actions.resetCancelSubscription]: setStatic({ cancelSubscription: fetchDefault(false) }),
    },
    defaultState.api
  ),
  ui: typeToReducer(
    {
    },
    defaultState.ui
  ),
};

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

export const createAppStore = (initialState, enhancers = []) =>
  createStore(
    combineReducers(reducers),
    initialState,
    composeEnhancers(
      applyMiddleware(ReduxThunk, promiseMiddleware()),
      ...enhancers
    )
  );
