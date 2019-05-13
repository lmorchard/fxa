import React, { useContext, useEffect } from 'react';
import { connect } from 'react-redux';
import { actions, selectors } from '../store';
import { State, PlansFetchState } from '../store/types';
import { Link } from 'react-router-dom';

import AppContext from '../lib/AppContext';

import LoadingSpinner from '../components/LoadingSpinner';

type IndexProps = {
  isLoading: boolean,
  plans: PlansFetchState,
  products: Array<string>,
  fetchPlans: Function,
};

export const Index = ({
  isLoading,
  plans,
  products,
  fetchPlans,
}: IndexProps) => {
  const { accessToken } = useContext(AppContext);

  useEffect(() => {
    if (accessToken) {
      fetchPlans(accessToken);
    }
  }, [ accessToken, fetchPlans ]);

  if (isLoading) {
    return <LoadingSpinner />;
  }
  return (
    <div>
      <p>TODO: This should probably not be a useful page that links anywhere.</p>
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
  (state: State) => ({
    isLoading: selectors.isLoading(state),
    plans: selectors.plans(state),
    products: selectors.products(state),
  }),
  {
    fetchPlans: actions.fetchPlans
  }
)(Index);
