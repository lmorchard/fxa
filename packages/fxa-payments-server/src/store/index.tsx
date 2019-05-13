import { createStore, combineReducers, compose, applyMiddleware } from 'redux';
import { createActions } from 'redux-actions';
import ReduxThunk from 'redux-thunk';
import { createPromise as promiseMiddleware } from 'redux-promise-middleware';
import typeToReducer from 'type-to-reducer';

import config from '../lib/config';

import {
  apiGet,
  apiDelete,
  apiPost,
  fetchDefault,
  fetchReducer,
  setStatic,
} from './utils';

import {
  State,
  ActionCreators,
} from './types';

import * as selectors from './selectors';
export { selectors };

const defaultState: State = {
  api: {
    cancelSubscription: fetchDefault(false),
    createSubscription: fetchDefault(false),
    plans: fetchDefault([]),
    profile: fetchDefault({}),
    subscriptions: fetchDefault([]),
    token: fetchDefault({}),  
  }
};

export const actions: ActionCreators = {
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

  // Convenience functions to produce action sequences via react-thunk functions

  createSubscriptionAndRefresh: (accessToken: string, params: object) =>
    async (dispatch: Function, getState: Function) => {
      await dispatch(actions.createSubscription(accessToken, params));
      return dispatch(actions.fetchSubscriptions(accessToken));
    },

  cancelSubscriptionAndRefresh: (accessToken: string, subscriptionId:object) => 
    async (dispatch: Function, getState: Function) => {
      await dispatch(actions.cancelSubscription(accessToken, subscriptionId));
      return dispatch(actions.fetchSubscriptions(accessToken));
    },
};

const reducers = {
  api: typeToReducer(
    {
      [actions.fetchProfile.toString()]:
        fetchReducer('profile'),
      [actions.fetchPlans.toString()]: 
        fetchReducer('plans'),
      [actions.fetchSubscriptions.toString()]: 
        fetchReducer('subscriptions'),
      [actions.fetchToken.toString()]:
        fetchReducer('token'),
      [actions.createSubscription.toString()]:
        fetchReducer('createSubscription'),
      [actions.cancelSubscription.toString()]:
        fetchReducer('cancelSubscription'),
      [actions.updateApiData.toString()]:
        (state, { payload }) => ({ ...state, ...payload }),
      [actions.resetCreateSubscription.toString()]:
        setStatic({ createSubscription: fetchDefault(false) }),
      [actions.resetCancelSubscription.toString()]:
        setStatic({ cancelSubscription: fetchDefault(false) }),
    },
    defaultState.api
  ),
};

const composeEnhancers =
  // @ts-ignore declare this property __REDUX_DEVTOOLS_EXTENSION_COMPOSE__
  (typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__)
  || compose;

export const createAppStore = (initialState?: State, enhancers: Array<any> = []) =>
  createStore(
    combineReducers(reducers),
    // @ts-ignore TODO: This produces a very obscure error, but the code works properly.
    initialState,
    composeEnhancers(
      applyMiddleware(ReduxThunk, promiseMiddleware()),
      ...enhancers
    )
  );
