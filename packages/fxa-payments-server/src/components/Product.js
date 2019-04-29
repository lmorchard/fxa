import React, { useState, useEffect, useCallback } from 'react';
import { connect, useDispatch } from 'react-redux';
import { injectStripe, CardElement, Elements } from 'react-stripe-elements';
import { selectorsFromState, actions } from '../store';
import { Link } from 'react-router-dom';

import LoadingSpinner from './LoadingSpinner';
import ProductDetails from './ProductDetails';

export const Product = ({
  match: {
    params: {
      productId = null
    }
  } = {},
  accessToken,
  isLoading = false,
  plans = {},
  createSubscriptionStatus = {},
  plansByProductId,
  createSubscription,
}) => {
  const [ planIdx, setPlanIdx ] = useState(0);

  const dispatch = useDispatch();

  const resetCreateSubscription = useCallback(() => {
    dispatch(actions.resetCreateSubscription());
  }, [ dispatch ]);

  // Reset subscription creation status on initial render.
  useEffect(() => {
    resetCreateSubscription();
  }, [ resetCreateSubscription ]);

  // Fetch plans on initial render, change in product ID, or auth change.
  useEffect(() => {
    if (accessToken) {
      dispatch(actions.fetchPlans(accessToken));
    }
  }, [ dispatch, productId, accessToken ]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (plans.error) {
    return <div>(plans error! {'' + plans.error})</div>;
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
      Created subscription. (todo: redirect / link to product download page)<br />
      <Link to="/subscriptions">Manage subscriptions</Link>
    </div>;
  }

  return (
    <div>
      <div>
        <h2>Let's set up your subscription</h2>
        {/* TODO: only one plan per product for MVP, but including some plan selection buttons for demo purposes */}
        {productPlans.length > 1 && (
          <ul>
            {productPlans.map(({ plan_id }, idx) => (
              <li key={plan_id}>
                <button onClick={() => setPlanIdx(idx)}>Select plan {plan_id}</button>
              </li>
            ))}
          </ul>
        )}
        <ProductDetails plan={selectedPlan} />
      </div>
      <Elements>
        <SubscriptionForm {...{
          accessToken,
          createSubscription,
          selectedPlan,
        }} />
      </Elements>
    </div>
  );
};

const SubscriptionForm = injectStripe(({
  accessToken,
  selectedPlan,
  createSubscription,
  stripe,
}) => {
  const onSubmit = useCallback(ev => {
    ev.preventDefault();

    const data = new FormData(ev.target);
    // eslint-disable-next-line camelcase
    const [ name ] = [ 'name' ].map(name => data.get(name));

    stripe
      .createToken({ name, type: 'card' })
      .then(result => {
        console.log('RESULT', result);

        createSubscription(accessToken, {
          paymentToken: result.token.id,
          // eslint-disable-next-line camelcase
          planId: selectedPlan.plan_id,
        });
      });
  }, [ accessToken, selectedPlan, createSubscription, stripe ])

  return (
    <form onSubmit={onSubmit}>
      <h2>Payment information</h2>
      <ul>
        <li>
          <p>Name</p>
          <input name="name" />
        </li>
        <li>
          <p>Card details (e.g. 4242 4242 4242 4242)</p>
          <CardElement style={{base: {fontSize: '18px'}}} />
        </li>
        <li>
          <p>I authorize Mozilla to charge this payment method</p>
          <input type="checkbox" name="confirm" />
        </li>
        <li>
          <p>Confirm</p>
          <button>Submit</button>
        </li>
      </ul>
    </form>
  );

});

export default connect(
  selectorsFromState('isLoading', 'plans', 'createSubscriptionStatus', 'plansByProductId'),
  { createSubscription: actions.createSubscriptionAndRefresh }
)(Product);
