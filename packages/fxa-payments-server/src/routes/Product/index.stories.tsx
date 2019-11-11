import React from 'react';
import { storiesOf } from '@storybook/react';
// import { action } from '@storybook/addon-actions';
import { linkTo } from '@storybook/addon-links';
import MockApp, {
  defaultAppContextValue,
} from '../../../.storybook/components/MockApp';
import { QueryParams } from '../../lib/types';
import { APIError } from '../../lib/apiClient';
import { SignInLayout } from '../../components/AppLayout';
import { State as ValidatorState } from '../../lib/validator';
import { Product, ProductProps } from './index';
import { State } from '../../store/types';
import { fetchDefault } from '../../store/utils';
import { defaultState } from '../../store/reducers';

function init() {
  storiesOf('routes/Product', module)
    .add('subscribing with existing account', () => <ProductRoute />)
    .add('subscribing with new account', () => (
      <ProductRoute queryParams={{ activated: '1' }} />
    ))
    .add('success', () => (
      <ProductRoute
        initialState={mkState({
          customer: {
            loading: false,
            error: null,
            result: {
              ...MOCK_STATE.api.customer,
              subscriptions: [
                {
                  current_period_end: (Date.now() + 86400) / 1000,
                  current_period_start: (Date.now() - 86400) / 1000,
                  cancel_at_period_end: false,
                  end_at: null,
                  nickname: 'Example Plan',
                  plan_id: 'plan_123',
                  status: 'active',
                  subscription_id: 'sk_78987',
                },
              ],
            },
          },
        })}
      />
    ));

  storiesOf('routes/Product/page load', module)
    .add('profile loading', () => (
      <ProductRoute
        initialState={mkState({
          profile: { loading: true, error: null, result: null },
        })}
      />
    ))
    .add('profile error', () => (
      <ProductRoute
        initialState={mkState({
          profile: {
            loading: false,
            result: null,
            error: new APIError({
              statusCode: 500,
              message: 'Internal Server Error',
            }),
          },
        })}
      />
    ))
    .add('customer loading', () => (
      <ProductRoute
        initialState={mkState({
          customer: { loading: true, error: null, result: null },
        })}
      />
    ))
    .add('customer error', () => (
      <ProductRoute
        initialState={mkState({
          customer: {
            loading: false,
            result: null,
            error: new APIError({
              statusCode: 500,
              message: 'Internal Server Error',
            }),
          },
        })}
      />
    ))
    .add('plans loading', () => (
      <ProductRoute
        initialState={mkState({
          plans: { loading: true, error: null, result: null },
        })}
      />
    ))
    .add('plans error', () => (
      <ProductRoute
        initialState={mkState({
          plans: {
            loading: false,
            result: null,
            error: new APIError({
              statusCode: 500,
              message: 'Internal Server Error',
            }),
          },
        })}
      />
    ));

  storiesOf('routes/Product/payment failures', module)
    .add('card declined', () => (
      <ProductRoute
        routeProps={FAILURE_PROPS}
        initialState={mkState({
          createSubscription: {
            result: null,
            loading: false,
            error: {
              // Copy / paste of error content from API
              code: 'expired_card',
              message: 'Your card has expired.',
              errno: 181,
              error: 'Bad Request',
              info:
                'https://github.com/mozilla/fxa/blob/master/packages/fxa-auth-server/docs/api.md#response-format',
              statusCode: 402,
            },
          },
        })}
      />
    ))
    .add('miscellaneous', () => (
      <ProductRoute
        initialState={mkState({
          createSubscription: {
            result: null,
            loading: false,
            error: {
              code: '',
              message: 'Payment server request failed.',
            },
          },
        })}
      />
    ))
    .add('stripe.createToken() fails on submit', () => {
      const validatorInitialState = mkValidPaymentFormState();
      const applyStubsToStripe = (stripe: stripe.Stripe) => {
        stripe.createToken = (element: stripe.elements.Element | string) => {
          return Promise.reject({
            type: 'api_error',
            message: 'The Stripe system is down.',
          });
        };
        return stripe;
      };
      return (
        <ProductRoute
          applyStubsToStripe={applyStubsToStripe}
          routeProps={{
            ...MOCK_PROPS,
            validatorInitialState,
          }}
        />
      );
    });
}

const mkState = (props: {
  customer?: any;
  profile?: any;
  plans?: any;
  createSubscription?: any;
}): State => ({
  ...MOCK_STATE,
  api: {
    ...MOCK_STATE.api,
    // TODO: Figure out a typescript-safe way to DRY this up
    customer: { ...MOCK_STATE.api.customer, ...props.customer },
    profile: { ...MOCK_STATE.api.profile, ...props.profile },
    plans: { ...MOCK_STATE.api.plans, ...props.plans },
    createSubscription: {
      ...MOCK_STATE.api.createSubscription,
      ...props.createSubscription,
    },
  },
});

type ProductRouteProps = {
  initialState?: State;
  routeProps?: ProductProps;
  queryParams?: QueryParams;
  applyStubsToStripe?: (orig: stripe.Stripe) => stripe.Stripe;
};

const ProductRoute = ({
  initialState = MOCK_STATE,
  routeProps = MOCK_PROPS,
  queryParams = defaultAppContextValue.queryParams,
  applyStubsToStripe,
}: ProductRouteProps) => (
  <MockApp
    initialState={initialState}
    applyStubsToStripe={applyStubsToStripe}
    appContextValue={{
      ...defaultAppContextValue,
      queryParams,
    }}
  >
    <SignInLayout>
      <Product {...routeProps} />
    </SignInLayout>
  </MockApp>
);

const PRODUCT_ID = 'product_8675309';

const PROFILE = {
  amrValues: [],
  avatar: 'http://placekitten.com/256/256',
  avatarDefault: false,
  displayName: 'Foo Barson',
  email: 'foo@example.com',
  locale: 'en-US',
  twoFactorAuthentication: true,
  uid: '8675309asdf',
};

const PLANS = [
  {
    plan_id: 'plan_123',
    plan_name: 'Example Plan',
    product_id: PRODUCT_ID,
    product_name: 'Example Product',
    currency: 'USD',
    amount: 1050,
    interval: 'month',
  },
];

/*
const linkToSubscriptionSuccess = linkTo(
  'routes/Product',
  'subscription success'
);
*/

const MOCK_STATE = {
  ...defaultState,
  api: {
    ...defaultState.api,
    customer: fetchDefault({
      subscriptions: [],
    }),
    plans: fetchDefault(PLANS),
    profile: fetchDefault(PROFILE),
  },
};

const MOCK_PROPS: ProductProps = {
  match: {
    params: {
      productId: PRODUCT_ID,
    },
  },
  /*
  createSubscription: linkToSubscriptionSuccess,
  resetCreateSubscription: action('resetCreateSubscription'),
  resetCreateSubscriptionError: action('resetCreateSubscriptionError'),
  fetchProductRouteResources: action('fetchProductRouteResources'),
  createSubscriptionMounted: () => {},
  createSubscriptionEngaged: () => {},
  */
};

const FAILURE_PROPS = {
  ...MOCK_PROPS,
  resetCreateSubscriptionError: linkTo(
    'routes/Product',
    'subscribing with existing account'
  ),
};

const mkValidPaymentFormState = (): ValidatorState => ({
  error: null,
  fields: {
    name: {
      value: 'Foo Barson',
      valid: true,
      error: null,
      fieldType: 'input',
      required: true,
    },
    zip: {
      value: '90210',
      valid: true,
      error: null,
      fieldType: 'input',
      required: true,
    },
    creditCardNumber: {
      value: true,
      valid: null,
      error: null,
      fieldType: 'stripe',
      required: true,
    },
    expDate: {
      value: true,
      valid: null,
      error: null,
      fieldType: 'stripe',
      required: true,
    },
    cvc: {
      value: true,
      valid: null,
      error: null,
      fieldType: 'stripe',
      required: true,
    },
    confirm: {
      value: true,
      valid: true,
      error: null,
      fieldType: 'input',
      required: true,
    },
    submit: {
      value: null,
      valid: null,
      error: null,
      fieldType: 'input',
      required: false,
    },
  },
});

init();
