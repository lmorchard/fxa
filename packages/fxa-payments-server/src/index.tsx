import React from 'react';
import { render } from 'react-dom';
import { Provider as ReduxProvider } from 'react-redux';
import { createAppStore, actions } from './store';
import { StripeProvider } from 'react-stripe-elements';

import config from './lib/config';
import AppContext from './lib/AppContext';
import './index.scss';
import App from './App';

async function init() {
  const store = createAppStore();

  const hashParams = await getHashParams();
  const accessToken = await getVerifiedAccessToken(hashParams);

  // We should have gotten an accessToken or else redirected, but guard here
  // anyway because App component requires a token.
  if (accessToken) {
    [
      actions.fetchToken(accessToken),
      actions.fetchProfile(accessToken),
    ].map(store.dispatch);
  
    render(
      <StripeProvider apiKey={config.STRIPE_API_KEY}>
        <ReduxProvider store={store}>
          <AppContext.Provider value={{ accessToken, config }}>
            <App />
          </AppContext.Provider>
        </ReduxProvider>
      </StripeProvider>,
      document.getElementById('main-content')
    );  
  }
}

type ParsedParams = { [propName: string]: string };
const parseParams = (params: string): ParsedParams => params
  .substr(1)
  .split('&')
  .reduce((acc: ParsedParams, curr: string) => {
    const parts = curr.split('=').map(decodeURIComponent);
    acc[parts[0]] = parts[1];
    return acc;
  }, {});

// Parse params out of the location hash, then remove the hash.
async function getHashParams() {
  const hashParams = parseParams(window.location.hash);
  window.history.replaceState('', document.title, window.location.pathname + window.location.search);
  return hashParams;
}

const ACCESS_TOKEN_KEY = 'fxa-access-token';
type getVerifiedAccessTokenArgs = { accessToken?: string | null };
async function getVerifiedAccessToken({
  accessToken = ''
}: getVerifiedAccessTokenArgs): Promise<string | null> {
  if (accessToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  } else {
    accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  try {
    const result = await fetch(
      `${config.OAUTH_API_ROOT}/verify`,
      {
        body: JSON.stringify({ token: accessToken }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      }
    );
    if (result.status !== 200) {
      accessToken = null;
      console.log('accessToken verify failed', result);
    }
  } catch (err) {
    console.log('accessToken verify error', err);
    accessToken = null;
  }

  if (! accessToken) {
    // TODO: bounce through a login redirect to get back here with a token
    window.location.href = `${config.CONTENT_SERVER_ROOT}/settings`;
    return accessToken;
  }

  console.log('accessToken verified');
  return accessToken;
}

init().then(
  () => console.log('init success'),
  err => console.log('init error', err)
);
