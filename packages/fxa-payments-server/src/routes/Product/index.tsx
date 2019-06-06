import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { QueryParams } from '../../lib/types';
import { actions, selectors } from '../../store';

import {
  State,
  Plan,
  SubscriptionsFetchState,
  PlansFetchState,
  CreateSubscriptionFetchState,
} from '../../store/types';

import ProductValueProposition from '../../components/ProductValueProposition';
import PaymentForm from '../../components/PaymentForm';

export type ProductProps = {
  match: {
    params: {
      productId: string,
    }
  },
  accessToken: string,
  queryParams: QueryParams,
  plans: PlansFetchState,
  createSubscriptionStatus: CreateSubscriptionFetchState,
  subscriptions: SubscriptionsFetchState,
  plansByProductId: (id: string) => Array<Plan>,
  createSubscription: Function,
  resetCreateSubscription: Function,
  fetchPlansAndSubscriptions: Function,
};

export const Product = ({
  match: {
    params: {
      productId
    }
  },
  accessToken,
  queryParams,
  plans,
  createSubscriptionStatus,
  subscriptions,
  plansByProductId,
  createSubscription,
  resetCreateSubscription,
  fetchPlansAndSubscriptions,
}: ProductProps) => {
  // Reset subscription creation status on initial render.
  useEffect(() => {
    resetCreateSubscription();
  }, [ resetCreateSubscription ]);

  // Fetch plans on initial render, change in product ID, or auth change.
  useEffect(() => {
    if (accessToken) {
      fetchPlansAndSubscriptions(accessToken);
    }
  }, [ fetchPlansAndSubscriptions, accessToken ]);

  if (plans.error) {
    return <div>(plans error! {'' + plans.error})</div>;
  }

  if (subscriptions.error) {
    return <div>(subscriptions error! {'' + subscriptions.error})</div>;
  }

  const planId = queryParams.plan;
  const productPlans = plansByProductId(productId);
  let selectedPlan = productPlans
    .filter(plan => plan.plan_id === planId)[0];
  if (!selectedPlan) {
    selectedPlan = productPlans[0];
  }

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

  // TODO: Rename productName column to productId
  // https://github.com/mozilla/fxa/issues/1187
  const alreadyHasProduct = (subscriptions.result || [])
    .some(subscription => subscription.productName === productId);
  if (alreadyHasProduct) {
    return <div>
      <h2>TODO: Already have a subscription to the product. Redirect to product goes here?</h2>
      <Link to="/subscriptions">Manage subscriptions</Link>
    </div>;
  }

  const onPayment = (tokenResponse: stripe.TokenResponse) => {
    console.log('RESULT', tokenResponse);
    if (tokenResponse && tokenResponse.token) {
      createSubscription(accessToken, {
        paymentToken: tokenResponse.token.id,
        // eslint-disable-next-line camelcase
        planId: selectedPlan.plan_id,
      });  
    }
  };

  return (
    <div>
      <div>
        <h2>Let&apos;s set up your subscription</h2>
        <ProductValueProposition plan={selectedPlan} />
      </div>
      <PaymentForm {...{ onPayment }} />
    </div>
  );
};

export default connect(
  (state: State) => ({
    plans: selectors.plans(state),
    subscriptions: selectors.subscriptions(state),
    createSubscriptionStatus: selectors.createSubscriptionStatus(state),
    plansByProductId: selectors.plansByProductId(state),
  }),
  {
    createSubscription: actions.createSubscriptionAndRefresh,
    resetCreateSubscription: actions.resetCreateSubscription,
    fetchPlansAndSubscriptions: actions.fetchPlansAndSubscriptions,
  }
)(Product);
