import React from 'react';
import { DetailsProps } from './index';

export const DefaultDetails = ({
  plan: {
    currency,
    amount,
    interval,
    plan_name,
  }
}: DetailsProps) => {
  return <>
    <h2>Let's set up your subscription</h2>
    <p>For {currency} {amount} per {interval}, your {plan_name} includes:</p>
    <p>Lorem ipsum dolor amet</p>
  </>;
};

export default DefaultDetails;