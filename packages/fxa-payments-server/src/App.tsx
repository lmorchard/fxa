import React, { useContext } from 'react';
import { Route, BrowserRouter as Router } from 'react-router-dom';
import { Link } from 'react-router-dom';

import AppContext from './lib/AppContext';

import './App.scss';
import LoadingSpinner from './components/LoadingSpinner';
import Profile from './components/Profile';

const Home = React.lazy(() => import('./routes/Home'));
const Product = React.lazy(() => import('./routes/Product'));
const Subscriptions = React.lazy(() => import('./routes/Subscriptions'));

export const App = () => {
  const { config } = useContext(AppContext);

  return (
    <Router>
      <Profile />
      
      <a href={`${config.CONTENT_SERVER_ROOT}/settings`}>&#x2039; Back to FxA Settings</a><br />
      <Link to="/">&#x2039; Back to index</Link>

      <div className="app">
        <React.Suspense fallback={<LoadingSpinner />}>
          <Route path="/" exact component={Home} />
          <Route path="/subscriptions" exact component={Subscriptions} />
          <Route path="/products/:productId" component={Product} />
        </React.Suspense>
      </div>
    </Router>
  );
};

export default App;
