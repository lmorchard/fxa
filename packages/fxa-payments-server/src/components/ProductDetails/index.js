// eslint-disable-next-line no-unused-vars
import React from 'react';

// Table of lazy-loaded product detail components
const availableDetails = {
  '123doneProProduct': React.lazy(() => import('./Details123donePro')),
  '321doneProProduct': React.lazy(() => import('./Details321donePro')),
  //'allDoneProProduct': React.lazy(() => import('./DetailsAlldonePro')),
};

const DefaultDetails = plan => <pre>{JSON.stringify(plan, null, ' ')}</pre>;

const ProductDetails = ({ plan }) => {
  const Details = plan.product_id in availableDetails
    ? availableDetails[plan.product_id]
    : DefaultDetails;

  return (
    <div class="productDetails">
      <p>For {plan.currency} {plan.amount} per {plan.interval}, your {plan.product_id} includes:</p>
      <Details plan={plan} />
    </div>
  );
};

export default ProductDetails;
