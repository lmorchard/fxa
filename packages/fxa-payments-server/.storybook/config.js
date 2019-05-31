import { configure } from '@storybook/react';

import '../src/index.scss';
import '../src/App.scss';

const reqFromComponents = require.context('../src/components', true, /\.stories.tsx?$/);
const reqFromRoutes = require.context('../src/routes', true, /\.stories.tsx?$/);

function loadStories() {
  [
    reqFromComponents,
    reqFromRoutes
  ].forEach(req => req.keys().forEach(filename => req(filename)));
}

configure(loadStories, module);
