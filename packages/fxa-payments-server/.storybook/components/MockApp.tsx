import React, { useEffect, useMemo, ReactNode } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { action } from '@storybook/addon-actions';
import { StripeProvider } from 'react-stripe-elements';
import { MockLoader } from './MockLoader';
import { AppContext, AppContextType } from '../../src/lib/AppContext';
import { createAppStore } from '../../src/store';
import { defaultState } from '../../src/store/reducers';
import { Store, State } from '../../src/store/types';
import { config } from '../../src/lib/config';
import ScreenInfo from '../../src/lib/screen-info';

declare global {
  interface Window {
    Stripe: stripe.StripeStatic;
  }
}

type MockAppProps = {
  children: ReactNode;
  initialState?: State;
  storeEnhancers?: Array<any>;
  appContextValue?: AppContextType;
  stripeApiKey?: string;
  applyStubsToStripe?: (orig: stripe.Stripe) => stripe.Stripe;
};

export const defaultAppContextValue: AppContextType = {
  config: {
    ...config,
    productRedirectURLs: {
      product_8675309: 'https://example.com/product',
    },
    servers: {
      ...config.servers,
      content: {
        url: 'https://accounts.firefox.com',
      },
    },
  },
  queryParams: {},
  navigateToUrl: action('navigateToUrl'),
  getScreenInfo: () => new ScreenInfo(window),
  matchMedia: (query: string) => window.matchMedia(query).matches,
  locationReload: action('locationReload'),
};

export const defaultStripeStubs = (stripe: stripe.Stripe) => {
  stripe.createToken = (element: stripe.elements.Element | string) => {
    return Promise.resolve({
      token: {
        id: 'asdf',
        object: 'mock_object',
        client_ip: '123.123.123.123',
        created: Date.now(),
        livemode: false,
        type: 'card',
        used: false,
      },
    });
  };
  return stripe;
};

export const MockApp = ({
  children,
  stripeApiKey = '8675309',
  applyStubsToStripe = defaultStripeStubs,
  appContextValue = defaultAppContextValue,
  initialState = defaultState,
  storeEnhancers,
}: MockAppProps) => {
  const store = useMemo<Store>(
    () => createAppStore(initialState, storeEnhancers),
    [initialState, storeEnhancers]
  );

  const mockStripe = useMemo<stripe.Stripe>(
    () => applyStubsToStripe(window.Stripe(stripeApiKey)),
    [stripeApiKey, applyStubsToStripe]
  );

  // HACK: Set attributes on <html> dynamically because it's very hard to
  // customize the template in Storybook
  useEffect(() => {
    const el = document.documentElement;
    el.setAttribute('lang', 'en');
    el.setAttribute('dir', 'ltr');
    el.setAttribute('class', 'js no-touch no-reveal-pw getusermedia');
  }, []);

  return (
    <ReduxProvider store={store}>
      <StripeProvider stripe={mockStripe}>
        <AppContext.Provider value={appContextValue}>
          <MockLoader>{children}</MockLoader>
        </AppContext.Provider>
      </StripeProvider>
    </ReduxProvider>
  );
};

export default MockApp;
