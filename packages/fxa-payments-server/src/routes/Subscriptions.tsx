import React, { useContext, useCallback, useEffect } from 'react';
import { connect } from 'react-redux';
import { actions, selectors } from '../store';
import { State, SubscriptionsFetchState, Subscription as SubscriptionType } from '../store/types';
import { useBooleanState, useCheckboxState } from '../lib/hooks';
import LoadingSpinner from '../components/LoadingSpinner';
import AppContext from '../lib/AppContext';

type SubscriptionsProps = {
  isLoading: boolean,
  subscriptions: SubscriptionsFetchState,
  cancelSubscription: Function,
  resetCancelSubscription: Function,
  fetchSubscriptions: Function,
};
export const Subscriptions = ({
  isLoading,
  subscriptions,
  cancelSubscription,
  resetCancelSubscription,
  fetchSubscriptions
}: SubscriptionsProps) => {
  const { accessToken } = useContext(AppContext);

  // Reset subscription cancel status on initial render.
  useEffect(() => {
    resetCancelSubscription();
  }, [ resetCancelSubscription ]);

  // Fetch subscriptions on initial render or auth change.
  useEffect(() => {
    if (accessToken) {
      fetchSubscriptions(accessToken);
    }
  }, [ accessToken, fetchSubscriptions ]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (subscriptions.error) {
    // TODO: fixup as part of final UX & visuals for #718
    return <div>(subscriptions error! {'' + subscriptions.error})</div>;
  }

  return (
    <div>
      <h2>Subscriptions</h2>
      {subscriptions.result.length === 0 && (
        <div>No subscriptions yet.</div>
      )}
      {subscriptions.result.map((subscription, idx) =>
        <Subscription key={idx} {...{ accessToken, cancelSubscription, subscription }} />)}
    </div>
  );
};

type SubscriptionProps = {
  accessToken: string,
  subscription: SubscriptionType,
  cancelSubscription: Function,
};
export const Subscription = ({
  accessToken,
  cancelSubscription,
  subscription: {
    subscriptionId,
    productName,
    createdAt
  },
}: SubscriptionProps) => {
  const [ cancelRevealed, revealCancel, hideCancel ] = useBooleanState();
  const [ confirmationChecked, onConfirmationChanged ] = useCheckboxState();
  const confirmCancellation = useCallback(
    () => cancelSubscription(accessToken, subscriptionId),
    [ accessToken, cancelSubscription, subscriptionId ]
  );

  return (
    <div className="subscription">
      <h3>{productName}</h3>
      <p>{subscriptionId} - {productName} - {'' + new Date(createdAt)}</p>
      {! cancelRevealed ? <>
        <div>Cancel subscription <button onClick={revealCancel}>Cancel...</button></div>
      </> : <>
        <p>Cancel subscription</p>
        <p>Cancelling means you&apos;ll no longer be able to access the product...</p>
        <p>
          <label>
            <input type="checkbox" defaultChecked={confirmationChecked} onChange={onConfirmationChanged} />
            Cancel my access and my saved information
          </label>
        </p>
        <p>
          <button onClick={hideCancel}>No, Stay Subscribed</button>
          <button onClick={confirmCancellation} disabled={! confirmationChecked}>Yes, Cancel My Subscription</button>
        </p>
      </>}
    </div>
  );
};

export default connect(
  (state: State) => ({
    isLoading: selectors.isLoading(state),
    subscriptions: selectors.subscriptions(state),
  }),
  {
    cancelSubscription: actions.cancelSubscriptionAndRefresh,
    resetCancelSubscription: actions.resetCancelSubscription,
    fetchSubscriptions: actions.fetchSubscriptions,
  }
)(Subscriptions);
