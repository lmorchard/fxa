// eslint-disable-next-line no-unused-vars
import React, { useCallback, useEffect } from 'react';
import { connect, useDispatch } from 'react-redux';
import { selectorsFromState, actions } from '../store';

import LoadingSpinner from './LoadingSpinner';

export const Subscriptions = ({
  accessToken,
  isLoading = false,
  subscriptions = [],
  cancelSubscription,
}) => {
  const dispatch = useDispatch();

  const resetCancelSubscription = useCallback(() => {
    dispatch(actions.resetCancelSubscription());
  }, [ dispatch ]);

  // Reset subscription cancel status on initial render.
  useEffect(() => {
    resetCancelSubscription();
  }, [ resetCancelSubscription ]);

  // Fetch subscriptions on initial render or auth change.
  useEffect(() => {
    if (accessToken) {
      dispatch(actions.fetchSubscriptions(accessToken));
    }
  }, [ dispatch, accessToken ]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <h2>Current Subscriptions</h2>
      <ul>
        {subscriptions.loading && <li>(subscriptions loading...)</li>}
        {subscriptions.error && <h1>(subscriptions error! {'' + subscriptions.error})</h1>}
        {subscriptions.result && (
          subscriptions.result.length === 0 ? (
            <li>No subscriptions yet.</li>
          ) : (
            subscriptions.result.map(({ subscriptionId, productName, createdAt }) => (
              <li key={subscriptionId}>
                <button onClick={() => cancelSubscription(accessToken, subscriptionId)}>Cancel!</button>
                {' '}- {subscriptionId} - {productName} - {createdAt}
              </li>
            ))
          )
        )}
      </ul>
    </div>
  );
};

export default connect(
  selectorsFromState('subscriptions'),
  { cancelSubscription: actions.cancelSubscriptionAndRefresh }
)(Subscriptions);
