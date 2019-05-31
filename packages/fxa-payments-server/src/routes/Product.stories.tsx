import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import MockApp from '../../.storybook/components/MockApp';
import { Product, ProductProps } from './Product';

function init() {
  storiesOf('routes/Product', module)
    .add('basic', () => (
      <MockApp>
        <Product {...mockProps} />
      </MockApp>
    ));
}

const PRODUCT_ID = 'product_8675309';

const PLANS = [
  {
    plan_id: 'plan_123',
    plan_name: 'Example Plan',
    product_id: PRODUCT_ID,
    product_name: 'Example Product',
    currency: 'USD',
    amount: 1099,
    interval: 'month'
  }
];

const mockProps: ProductProps = {
  match: {
    params: {
      productId: PRODUCT_ID
    }
  },
  accessToken: 'mock_token',
  plans: {
    error: null,
    loading: false,
    result: PLANS,
  },
  createSubscriptionStatus: {
    error: null,
    loading: false,
    result: null,
  },
  subscriptions: {
    error: null,
    loading: false,
    result: null,
  },
  plansByProductId: (_) => PLANS,
  createSubscription: action('createSubscription'),
  resetCreateSubscription: action('resetCreateSubscription'),
  fetchPlansAndSubscriptions: action('fetchPlansAndSubscriptions'),
};

init();