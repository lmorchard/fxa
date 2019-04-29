import React from 'react';
import { render } from 'react-dom';
import { createAppStore, actions } from './store';

import config from './config';
import './styles/index.scss';
import App from './components/App';

async function init() {
  const store = createAppStore();

  const hashParams = await getHashParams();
  const accessToken = await getVerifiedAccessToken(hashParams);

  [
    actions.fetchToken(accessToken),
    actions.fetchProfile(accessToken),
  ].map(store.dispatch);

  render(
    <App {...{ accessToken, config, store }} />,
    document.getElementById('main-content')
  );
}

const parseParams = params => params
  .substr(1)
  .split('&')
  .reduce((acc, curr) => {
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
async function getVerifiedAccessToken({ accessToken = null }) {
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
    window.location = `${config.CONTENT_SERVER_ROOT}/settings`;
  }

  console.log('accessToken verified');
  return accessToken;
}

init().then(
  () => console.log('init success'),
  err => console.log('init error', err)
);