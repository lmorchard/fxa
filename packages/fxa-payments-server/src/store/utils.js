import { ActionType as PromiseActionType } from 'redux-promise-middleware';

export const mapToObject = (list, mapFn) => {
  const out = {};
  for (const item of list) {
    out[item] = mapFn(item);
  }
  return out;
};

export class APIError extends Error {
  constructor(response, ...params) {
    super(...params);
    this.response = response;
  }
}

export const apiFetch = (method, accessToken, path, options = {}) => {
  return fetch(path, {
    mode: 'cors',
    credentials: 'omit',
    method,
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      ...options.headers || {}
    },
  }).then(response => {
    if (response.status >= 400) {
      throw new APIError(response, 'status ' + response.status);
    }
    return response.json();
  });
};

export const apiGet = (...args) => apiFetch('GET', ...args);

export const apiDelete = (...args) => apiFetch('DELETE', ...args);

export const apiPost = (accessToken, path, body) =>
  apiFetch('POST', accessToken, path, { body: JSON.stringify(body) });

export const setStatic = newState => state => ({ ...state, ...newState });

export const setAsPayload = (state, { payload }) => payload;

export const setFromPayload = (name, defval) => (state, { payload }) =>
  ({ ...state, [name]: payload || defval });

export const setFromPayloadFn = fn => (state, { payload }) =>
  ({ ...state, ...fn(payload) });

export const fetchDefault = defaultResult =>
  ({ error: null, loading: false, result: defaultResult });

export const fetchReducer = name => ({
  [PromiseActionType.Pending]: state =>
    ({ ...state, [name]: { error: null, loading: true, result: null } }),
  [PromiseActionType.Fulfilled]: (state, { payload }) =>
    ({ ...state, [name]: { error: null, loading: false, result: payload } }),
  [PromiseActionType.Rejected]: (state, { payload }) =>
    ({ ...state, [name]: { error: payload, loading: false, result: null } }),
});
