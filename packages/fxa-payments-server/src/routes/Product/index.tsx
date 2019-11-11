import React, {
  useEffect,
  useState,
  useCallback,
  useContext,
  useMemo,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { AuthServerErrno, getErrorMessage } from '../../lib/errors';
import * as thunks from '../../store/thunks';
import * as actions from '../../store/actions';
import { AppContext } from '../../lib/AppContext';
import FlowEvent from '../../lib/flow-event';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { State as ValidatorState } from '../../lib/validator';

import * as selectors from '../../store/selectors';
import { Profile } from '../../store/types';

import './index.scss';

import DialogMessage from '../../components/DialogMessage';
import ErrorMessage from '../../components/ErrorMessage';
import PaymentForm from '../../components/PaymentForm';
import PlanDetails from './PlanDetails';
import SubscriptionRedirect from './SubscriptionRedirect';

export type ProductProps = {
  match: {
    params: {
      productId: string;
    };
  };
  validatorInitialState?: ValidatorState;
};

export const Product = ({
  match: {
    params: { productId },
  },
  validatorInitialState,
}: ProductProps) => {
  const { config, locationReload, queryParams } = useContext(AppContext);

  const {
    plan: planId = '',
    activated: accountActivated = false,
  } = queryParams;

  const customer = useSelector(selectors.customer);
  const customerSubscriptions = useSelector(selectors.customerSubscriptions);
  const profile = useSelector(selectors.profile);
  const plans = useSelector(selectors.plans);
  const createSubscriptionStatus = useSelector(
    selectors.createSubscriptionStatus
  );
  const plansByProductId = useSelector(selectors.plansByProductId);

  const dispatch = useDispatch();
  // TODO: Find a typescript-safe way to DRY this up
  const [
    createSubscription,
    resetCreateSubscriptionError,
    createSubscriptionEngaged,
    createSubscriptionMounted,
  ] = useMemo(
    () => [
      (...args: Parameters<typeof thunks.createSubscriptionAndRefresh>) =>
        dispatch(thunks.createSubscriptionAndRefresh(...args)),
      (...args: Parameters<typeof actions.resetCreateSubscription>) =>
        dispatch(actions.resetCreateSubscription(...args)),
      (...args: Parameters<typeof actions.createSubscriptionMounted>) =>
        dispatch(actions.createSubscriptionMounted(...args)),
      (...args: Parameters<typeof actions.createSubscriptionEngaged>) =>
        dispatch(actions.createSubscriptionEngaged(...args)),
    ],
    [dispatch]
  );

  // There is no way to do this with a React Hook. We need the
  // `navigationTiming.domComplete` value to calculate the "client" perf metric.
  // When `useEffect` is used, the `domComplete` value is always(?) null because
  // it fires too early. This is the reliable approach.
  window.onload = () =>
    FlowEvent.logPerformanceEvent('product', config.perfStartTime);

  const [createTokenError, setCreateTokenError] = useState({
    type: '',
    error: false,
  });

  // Fetch plans & reset subscription creation status on initial render.
  useEffect(() => {
    dispatch(actions.resetCreateSubscription());
    dispatch(thunks.fetchProductRouteResources());
  }, [dispatch]);

  // Figure out a selected plan for product, either from query param or first plan.
  const productPlans = plansByProductId(productId);
  let selectedPlan = productPlans.filter(plan => plan.plan_id === planId)[0];
  if (!selectedPlan) {
    selectedPlan = productPlans[0];
  }

  const onPayment = useCallback(
    (tokenResponse: stripe.TokenResponse, name: string) => {
      if (tokenResponse && tokenResponse.token) {
        createSubscription(tokenResponse.token.id, selectedPlan, name);
      } else {
        // This shouldn't happen with a successful createToken() call, but let's
        // display an error in case it does.
        const error: any = { type: 'api_error', error: true };
        setCreateTokenError(error);
      }
    },
    [selectedPlan, createSubscription, setCreateTokenError]
  );

  const onPaymentError = useCallback(
    (error: any) => {
      error.error = true;
      setCreateTokenError(error);
    },
    [setCreateTokenError]
  );

  const isCardError =
    createSubscriptionStatus.error !== null &&
    (createSubscriptionStatus.error.code === 'card_declined' ||
      createSubscriptionStatus.error.code === 'incorrect_cvc');

  // clear any error rendered with `ErrorMessage` on form change
  const onChangeErrorDismiss = useCallback(() => {
    if (createTokenError.error) {
      setCreateTokenError({ type: '', error: false });
    } else if (isCardError) {
      resetCreateSubscriptionError();
    }
  }, [
    createTokenError,
    setCreateTokenError,
    resetCreateSubscriptionError,
    isCardError,
  ]);

  if (customer.loading || plans.loading || profile.loading) {
    return <LoadingOverlay isLoading={true} />;
  }

  if (profile.error !== null) {
    return (
      <DialogMessage className="dialog-error" onDismiss={locationReload}>
        <h4 data-testid="error-loading-profile">Problem loading profile</h4>
        <p>{profile.error.message}</p>
      </DialogMessage>
    );
  }

  if (plans.error !== null) {
    return (
      <DialogMessage className="dialog-error" onDismiss={locationReload}>
        <h4 data-testid="error-loading-plans">Problem loading plans</h4>
        <p>{plans.error.message}</p>
      </DialogMessage>
    );
  }

  if (
    customer.error &&
    // Unknown customer just means the user hasn't subscribed to anything yet
    customer.error.errno !== AuthServerErrno.UNKNOWN_SUBSCRIPTION_CUSTOMER
  ) {
    return (
      <DialogMessage className="dialog-error" onDismiss={locationReload}>
        <h4 data-testid="error-loading-customer">
          Problem loading customer information
        </h4>
        <p>{customer.error.message}</p>
      </DialogMessage>
    );
  }

  if (!selectedPlan) {
    return (
      <DialogMessage className="dialog-error" onDismiss={locationReload}>
        <h4>Plan not found</h4>
        <p data-testid="no-such-plan-error">No such plan for this product.</p>
      </DialogMessage>
    );
  }

  // If the customer has any subscription plan that matches a plan for the
  // selected product, then they are already subscribed.
  const customerIsSubscribed =
    !customer.error &&
    !plans.error &&
    customerSubscriptions &&
    customerSubscriptions.some(customerSubscription =>
      productPlans.some(plan => plan.plan_id === customerSubscription.plan_id)
    );

  if (customerIsSubscribed) {
    return (
      <div className="product-payment">
        <SubscriptionRedirect {...{ plan: selectedPlan }} />
      </div>
    );
  }

  const inProgress = createSubscriptionStatus.loading;

  return (
    <div className="product-payment">
      {profile.result && (
        <>
          {accountActivated ? (
            <AccountActivatedBanner profile={profile.result} />
          ) : (
            <ProfileBanner profile={profile.result} />
          )}
          <hr />
        </>
      )}

      <PlanDetails plan={selectedPlan} />

      <hr />

      <h3 className="billing-title">
        <span>Billing Information</span>
      </h3>

      <ErrorMessage isVisible={!!createTokenError.error}>
        {createTokenError.error && (
          <p data-testid="error-payment-submission">
            {getErrorMessage(createTokenError.type)}
          </p>
        )}
      </ErrorMessage>

      <ErrorMessage isVisible={isCardError}>
        <p data-testid="error-card-rejected">{getErrorMessage('card_error')}</p>
      </ErrorMessage>

      {createSubscriptionStatus.error && !isCardError && (
        <DialogMessage
          className="dialog-error"
          onDismiss={resetCreateSubscriptionError}
        >
          <h4 data-testid="error-subscription-failed">Subscription failed</h4>
          <p>{createSubscriptionStatus.error.message}</p>
        </DialogMessage>
      )}

      <PaymentForm
        {...{
          onPayment,
          onPaymentError,
          onChangeErrorDismiss,
          inProgress,
          validatorInitialState,
          confirm: true,
          plan: selectedPlan,
          onMounted: createSubscriptionMounted,
          onEngaged: createSubscriptionEngaged,
        }}
      />
    </div>
  );
};

type ProfileProps = {
  profile: Profile;
};

const ProfileBanner = ({
  profile: { email, avatar, displayName },
}: ProfileProps) => (
  <div className="profile-banner">
    <img className="avatar hoisted" src={avatar} alt={displayName || email} />
    {displayName && (
      <h2 data-testid="profile-display-name" className="displayName">
        {displayName}
      </h2>
    )}
    <h3 data-testid="profile-email" className="name email">
      {email}
    </h3>
    {/* TODO: what does "switch account" do? need to re-login and redirect eventually back here?
      <a href="">Switch account</a>
    */}
  </div>
);

const AccountActivatedBanner = ({
  profile: { email, displayName },
}: ProfileProps) => (
  <div data-testid="account-activated" className="account-activated">
    <h2>
      Your account is activated,{' '}
      {displayName ? (
        <>
          <span data-testid="activated-display-name" className="displayName">
            {displayName}
          </span>
        </>
      ) : (
        <>
          <span data-testid="activated-email" className="email">
            {email}
          </span>
        </>
      )}
    </h2>
  </div>
);

export default Product;
