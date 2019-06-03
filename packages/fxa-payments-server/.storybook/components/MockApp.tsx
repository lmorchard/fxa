import React, { ReactNode } from 'react';
import config from '../../src/lib/config';
import { StripeProvider } from 'react-stripe-elements';
import { MockLoader } from './MockLoader';

type MockAppProps = {
  children: ReactNode
};

export const MockApp = ({ children }: MockAppProps) => 
  <div style={{
    width: '100vw',
    height: '100vh',
  }}>
    <StripeProvider apiKey={config.STRIPE_API_KEY}>
      <MockLoader>
        {children}
      </MockLoader>
    </StripeProvider>
  </div>;

export default MockApp;