import React, { useContext, useState, useEffect, useCallback } from 'react';
import { connect } from 'react-redux';
import { injectStripe, CardElement, Elements as StripeElements, ReactStripeElements } from 'react-stripe-elements';
import { Link } from 'react-router-dom';
import { selectors, actions } from '../store';
import { State } from '../store/types';

import {
  Plan,
  SubscriptionsFetchState,
  PlansFetchState,
  CreateSubscriptionFetchState,
} from '../store/types';

import LoadingSpinner from '../components/LoadingSpinner';
import ProductValueProposition from '../components/ProductValueProposition';
import { useCheckboxState } from '../lib/hooks';
import AppContext from '../lib/AppContext';

type ProductProps = {
  match: {
    params: {
      productId: string,
    }
  },
  isLoading: boolean,
  plans: PlansFetchState,
  createSubscriptionStatus: CreateSubscriptionFetchState,
  subscriptions: SubscriptionsFetchState,
  plansByProductId: Function,
  createSubscription: Function,
  resetCreateSubscription: Function,
  fetchPlans: Function,
  fetchSubscriptions: Function,
};

export const Product = ({
  match: {
    params: {
      productId
    }
  },
  isLoading,
  plans,
  createSubscriptionStatus,
  subscriptions,
  plansByProductId,
  createSubscription,
  resetCreateSubscription,
  fetchPlans,
  fetchSubscriptions,
}: ProductProps) => {
  const { accessToken } = useContext(AppContext);

  const [ planIdx, setPlanIdx ] = useState(0);

  // Reset subscription creation status on initial render.
  useEffect(() => {
    resetCreateSubscription();
  }, [ resetCreateSubscription ]);

  // Fetch plans on initial render, change in product ID, or auth change.
  useEffect(() => {
    if (accessToken) {
      fetchPlans(accessToken);
      fetchSubscriptions(accessToken);
    }
  }, [ accessToken, fetchPlans, fetchSubscriptions ]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (plans.error) {
    return <div>(plans error! {'' + plans.error})</div>;
  }

  if (subscriptions.error) {
    return <div>(subscriptions error! {'' + subscriptions.error})</div>;
  }

  const productPlans = plansByProductId(productId);
  const selectedPlan = productPlans[planIdx];

  if (! selectedPlan) {
    return <div>No plans available for this product.</div>;
  }

  if (createSubscriptionStatus.loading) {
    return <div>Creating subscription...</div>;
  }

  if (createSubscriptionStatus.error) {
    return <div>
      Problem creating subscription:
      {'' + createSubscriptionStatus.error}
    </div>;
  }

  if (createSubscriptionStatus.result) {
    return <div>
      <h2>TODO: Redirect to product goes here</h2>
      <Link to="/subscriptions">Manage subscriptions</Link>
    </div>;
  }

  const alreadyHasProduct = subscriptions.result
    .some(subscription => subscription.productName === productId);
  if (alreadyHasProduct) {
    return <div>
      <h2>TODO: Already have a subscription to the product. Redirect to product goes here?</h2>
      <Link to="/subscriptions">Manage subscriptions</Link>
    </div>;
  }

  return (
    <div>
      <div>
        <h2>Let&apos;s set up your subscription</h2>
        {/* TODO: only one plan per product for MVP, but including some plan selection buttons for demo purposes */}
        {productPlans.length > 1 && (
          <ul>
            {/* eslint-disable camelcase */}
            {productPlans.map(({ plan_id }: Plan, idx: number) => (
              <li key={plan_id}>
                <button onClick={() => setPlanIdx(idx)}>Select plan {plan_id}</button>
              </li>
            ))}
            {/* eslint-enable camelcase */}
          </ul>
        )}
        <ProductValueProposition plan={selectedPlan} />
      </div>
      <StripeElements>
        <SubscriptionForm {...{
          accessToken,
          createSubscription,
          selectedPlan,
        }} />
      </StripeElements>
    </div>
  );
};

type SubscriptionFormProps = {
  accessToken: string,
  selectedPlan: Plan,
  createSubscription: Function,
};
export const SubscriptionFormRaw = ({
  accessToken,
  selectedPlan,
  createSubscription,
  stripe,
}: SubscriptionFormProps & ReactStripeElements.InjectedStripeProps) => {
  const [ confirmationChecked, onConfirmationChanged ] = useCheckboxState();

  const onSubmit = useCallback(ev => {
    ev.preventDefault();

    // TODO: use react state on form fields along with validation
    const data = new FormData(ev.target);
    const name = String(data.get('name'));

    if (stripe) {
      stripe
        .createToken({ name })
        .then((result) => {
          console.log('RESULT', result);

          createSubscription(accessToken, {
            paymentToken: result && result.token && result.token.id,
            // eslint-disable-next-line camelcase
            planId: selectedPlan.plan_id,
          });
        });
    }
  }, [ accessToken, selectedPlan, createSubscription, stripe ]);

  return (
    <form onSubmit={onSubmit}>
      <h2>Payment information</h2>
      <ul>
        <li>
          <input name="name" placeholder="Name" />
        </li>
        <li>
          <p>Card details (e.g. 4242 4242 4242 4242)</p>
          <CardElement style={{base: {fontSize: '18px'}}} />
        </li>
        <li>
          <label>
            <input type="checkbox" defaultChecked={confirmationChecked} onChange={onConfirmationChanged} />
            {' '}I authorize Mozilla to charge this payment method
          </label>
        </li>
        <li>
          <button disabled={! confirmationChecked}>Submit</button>
        </li>
      </ul>
    </form>
  );
};
export const SubscriptionForm = injectStripe(SubscriptionFormRaw);

export default connect(
  (state: State) => ({
    isLoading: selectors.isLoading(state),
    plans: selectors.plans(state),
    subscriptions: selectors.subscriptions(state),
    createSubscriptionStatus: selectors.createSubscriptionStatus(state),
    plansByProductId: selectors.plansByProductId(state),    
  }),
  {
    createSubscription: actions.createSubscriptionAndRefresh,
    resetCreateSubscription: actions.resetCreateSubscription,
    fetchPlans: actions.fetchPlans,
    fetchSubscriptions: actions.fetchSubscriptions,
  }
)(Product);
