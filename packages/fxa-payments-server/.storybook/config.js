import { configure } from '@storybook/react';
import { updateAPIClientFetchImpl } from '../src/lib/apiClient';

import '../src/index.scss';
import '../src/App.scss';
import './styles.scss';

const reqFromComponents = require.context(
  '../src/components',
  true,
  /\.stories.tsx?$/
);
const reqFromRoutes = require.context('../src/routes', true, /\.stories.tsx?$/);

function loadStories() {
  [reqFromComponents, reqFromRoutes].forEach(req =>
    req.keys().forEach(filename => req(filename))
  );
}

configure(loadStories, module);

//export async function mockApiFetchImpl(
export function mockApiFetchImpl(method, path, options = {}) {
  console.log('mockApiFetchImpl', { method, path, options });
}

updateAPIClientFetchImpl(mockApiFetchImpl);
