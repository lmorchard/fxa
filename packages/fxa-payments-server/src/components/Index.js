// eslint-disable-next-line no-unused-vars
import React, { useEffect, useCallback } from 'react';
import { connect, useDispatch } from 'react-redux';
import { actions, selectorsFromState, pickActions } from '../store';
import { Link } from 'react-router-dom';

import LoadingSpinner from './LoadingSpinner';

export const Index = ({
  isLoading = false,
  accessToken = '',
  plans = {},
  products = [],
}) => {
  const dispatch = useDispatch();
  
  useEffect(() => {
    if (accessToken) {
      dispatch(actions.fetchPlans(accessToken));
    }
  }, [ dispatch, accessToken ]);

  if (isLoading) {
    return <LoadingSpinner />;
  }
  return (
    <div>
      <p><Link to="/subscriptions">Manage subscriptions</Link></p>
      <h2>Available Products</h2>
      <ul>
        {plans.loading && <li>(plans loading...)</li>}
        {plans.error && <h1>(plans error! {'' + plans.error})</h1>}
        {plans.result && (
          products.map(productId =>
            <li key={productId}><Link to={`/products/${productId}`}>{productId}</Link></li>
          )
        )}
      </ul>
    </div>
  );
};

export default connect(
  selectorsFromState('plans', 'products'),
  pickActions('fetchPlans'),
)(Index);
