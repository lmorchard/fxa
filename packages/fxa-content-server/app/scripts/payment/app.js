/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import ConfigLoader from '../lib/config-loader';

async function init() {
  const params = parseParams(window.location.hash);

  const configLoader = new ConfigLoader();
  const config = await configLoader.fetch();
  configLoader.useConfig(config);

  render({ config, params });

  const authApiGet = path =>
    fetch(`http://127.0.0.1:9000/v1/${path}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${params.accessToken}` }
    }).then(response => response.json())

  const profile = await authApiGet('account/profile');
  const plans = await authApiGet('oauth/subscriptions/plans');
  const subscriptions = await authApiGet('oauth/subscriptions/active');

  render({ config, params, profile, plans, subscriptions });
}

function render(out) {
  document.body.innerHTML = `<pre>${JSON.stringify(out, null, '  ')}</pre>`;
}

const parseParams = params => params
  .split('&')
  .reduce((acc, curr) => {
    const parts = curr.substr(1).split('=').map(decodeURIComponent);
    acc[parts[0]] = parts[1];
    return acc;
  }, {});

init().then(
  () => console.log('init complete'),
  err => console.error('error', err)
);
