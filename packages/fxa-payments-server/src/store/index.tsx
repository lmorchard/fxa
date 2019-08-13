import { createStore, combineReducers, applyMiddleware } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import ReduxThunk, {
  ThunkAction,
  ThunkDispatch,
  ThunkMiddleware,
} from 'redux-thunk';
import { createPromise as promiseMiddleware } from 'redux-promise-middleware';
import typeToReducer from 'type-to-reducer';

import { config } from '../lib/config';

import {
  apiGet,
  apiDelete,
  apiPost,
  fetchDefault,
  fetchReducer,
  setStatic,
  mapToObject,
} from './utils';

import {
  Store,
  AnyAction,
  Action,
  State,
  Selectors,
  ActionCreators,
  Plan,
} from './types';

import actions from './actions';
import selectors from './selectors';

export { default as actions } from './actions';
export { default as selectors } from './selectors';

export const defaultState: State = {
  api: {
    cancelSubscription: fetchDefault(null),
    reactivateSubscription: fetchDefault(null),
    createSubscription: fetchDefault(null),
    customer: fetchDefault(null),
    plans: fetchDefault(null),
    profile: fetchDefault(null),
    updatePayment: fetchDefault(null),
    subscriptions: fetchDefault(null),
    token: fetchDefault(null),
  },
};

export const reducers = {
  api: typeToReducer(
    {
      [actions.fetchProfile.toString()]: fetchReducer('profile'),
      [actions.fetchPlans.toString()]: fetchReducer('plans'),
      [actions.fetchSubscriptions.toString()]: fetchReducer('subscriptions'),
      [actions.fetchToken.toString()]: fetchReducer('token'),
      [actions.fetchCustomer.toString()]: fetchReducer('customer'),
      [actions.createSubscription.toString()]: fetchReducer(
        'createSubscription'
      ),
      [actions.cancelSubscription.toString()]: fetchReducer(
        'cancelSubscription'
      ),
      [actions.reactivateSubscription.toString()]: fetchReducer(
        'reactivateSubscription'
      ),
      [actions.updatePayment.toString()]: fetchReducer('updatePayment'),
      [actions.updateApiData.toString()]: (state, { payload }) => ({
        ...state,
        ...payload,
      }),
      [actions.resetCreateSubscription.toString()]: setStatic({
        createSubscription: fetchDefault(null),
      }),
      [actions.resetCancelSubscription.toString()]: setStatic({
        cancelSubscription: fetchDefault(null),
      }),
      [actions.resetReactivateSubscription.toString()]: setStatic({
        reactivateSubscription: fetchDefault(null),
      }),
      [actions.resetUpdatePayment.toString()]: setStatic({
        updatePayment: fetchDefault(null),
      }),
    },
    defaultState.api
  ),
};

export const selectorsFromState = (...names: Array<string>) => (state: State) =>
  mapToObject(names, (name: string) => selectors[name](state));

export const pickActions = (...names: Array<string>) =>
  mapToObject(names, (name: string) => actions[name]);

export const createAppStore = (
  initialState?: State,
  enhancers: Array<any> = []
) =>
  createStore(
    combineReducers<State>(reducers),
    initialState,
    composeWithDevTools(
      applyMiddleware(
        ReduxThunk as ThunkMiddleware<State, Action>,
        promiseMiddleware()
      ),
      ...enhancers
    )
  );
