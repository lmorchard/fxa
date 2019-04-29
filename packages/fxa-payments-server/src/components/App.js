import React from 'react';
import { Provider } from 'react-redux';
import { StripeProvider } from 'react-stripe-elements';
import { Route, BrowserRouter as Router } from 'react-router-dom';
import { Link } from 'react-router-dom';

import './App.scss';
import LoadingSpinner from './LoadingSpinner';
import Profile from './Profile';
import Index from './Index';

// import Product from '../Product';
const Product = React.lazy(() => import('./Product'));
// import Subscriptions from '../Subscriptions';
const Subscriptions = React.lazy(() => import('./Subscriptions'));

export const App = ({ accessToken, config, store }) => {
  const commonRender = Component => props =>
    <Component {...{ accessToken, config, ...props }} />;

  return (
    <StripeProvider apiKey={config.STRIPE_API_KEY}>
      <Provider store={store}>
        <Router>
          <Profile />
          <a href={`${config.CONTENT_SERVER_ROOT}/settings`}>&#x2039; Back to FxA Settings</a><br />
            <Link to="/">&#x2039; Back to index</Link>

          <div className="app">
            <React.Suspense fallback={<LoadingSpinner />}>
              <Route path="/" exact render={commonRender(Index)} />
              <Route path="/subscriptions" exact render={commonRender(Subscriptions)} />
              <Route path="/products/:productId" render={commonRender(Product)} />
            </React.Suspense>
          </div>
        </Router>
      </Provider>
    </StripeProvider>
  );
};

export default App;
