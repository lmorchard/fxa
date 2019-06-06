import React from 'react';
import { Plan } from '../../store/types';

export type DetailsProps = { plan: Plan };

// Table of lazy-loaded product detail components
type availableDetailsType = {
  [propName: string]: React.LazyExoticComponent<(props: DetailsProps) => JSX.Element>
};
const availableDetails: availableDetailsType = {
  '123doneProProduct': React.lazy(() => import('./Details123donePro')),
  '321doneProProduct': React.lazy(() => import('./Details321donePro')),
};
const defaultDetails = React.lazy(() => import('./DetailsDefault'));

export const ProductValueProposition = ({
  plan
}: DetailsProps) => {
  const Details = plan.product_id in availableDetails
    ? availableDetails[plan.product_id]
    : defaultDetails;
  return (
    <div className="product-details">
      <Details plan={plan} />
    </div>
  );
};

export default ProductValueProposition;
