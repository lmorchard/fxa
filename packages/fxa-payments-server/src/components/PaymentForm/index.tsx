import React, { useCallback } from 'react';
import {
  injectStripe,
  CardNumberElement,
  CardExpiryElement,
  CardCVCElement,
  Elements,
  ReactStripeElements
} from 'react-stripe-elements';
import { useCheckboxState } from '../../lib/hooks';

import './index.scss';

type PaymentFormProps = {
  onPayment: (tokenResponse: stripe.TokenResponse) => void,
  onPaymentError: (error: any) => void,
} & ReactStripeElements.InjectedStripeProps;

export const PaymentForm = ({
  onPayment,
  onPaymentError,
  stripe,
}: PaymentFormProps) => {
  const [ confirmationChecked, onConfirmationChanged ] = useCheckboxState();

  const onSubmit = useCallback(ev => {
    ev.preventDefault();

    // TODO: use react state on form fields along with validation
    const data = new FormData(ev.target);
    const name = String(data.get('name'));

    if (stripe) {
      stripe
        .createToken({ name })
        .then(onPayment)
        .catch(onPaymentError);
    }
  }, [ onPayment, stripe ]);

  // ref: https://stripe.com/docs/stripe-js/reference#the-elements-object
  const stripeElementStyles = {
    base: {
      lineHeight: '48px',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
      fontSize: '16px',
    }
  };

  return (
    <form onSubmit={onSubmit} className="payment">
      <h3><span>Billing information</span></h3>

      <div className="input-row">
        <label>
          <span className="label-text">Name as it appears on your card</span>
          <input name="name" type="text" className="name tooltip-below" defaultValue="" spellCheck={false} required autoFocus />
          {/*
          <input name="name" type="text" className="name tooltip-below invalid" value="" spellCheck="false" required autofocus="autofocus" aria-invalid="true" aria-described-by="error-tooltip-1023" />
          <aside id="error-tooltip-1023" className="tooltip tooltip-below fade-up-tt">Valid email required</aside>
          */}
        </label>
      </div>

      <div className="input-row-group">
        <div className="input-row input-row--xl">
          <label>
            <span className="label-text">Credit Card Number</span>
            <CardNumberElement style={stripeElementStyles} />
          </label>
        </div>

        <div className="input-row">
          <label>
            <span className="label-text">Exp. Date</span>
            <CardExpiryElement style={stripeElementStyles} />
          </label>
        </div>

        <div className="input-row">
          <label>
            <span className="label-text">CVC</span>
            <CardCVCElement style={stripeElementStyles} />
          </label>
        </div>

        <div className="input-row">
          <label>
            <span className="label-text">Zip Code</span>
            <input name="zip" type="text" className="zip tooltip-below" defaultValue="" spellCheck={false} required autofocus />
          </label>
        </div>
      </div>
      
      <div className="input-row">
        <label className="checkbox">
          <input type="checkbox" defaultChecked={confirmationChecked} onChange={onConfirmationChanged} />
          <span className="label-text disclaimer">
            I authorize Mozilla, maker of Firefox products, to charge my payment method [cost] per [time frame], according to payment terms, until I cancel my subscription.
          </span>
        </label>
      </div>
      
      <div className="button-row">
        <button id="submit-btn" type="submit" disabled={! confirmationChecked}>Submit</button>
      </div>

      <div className="legal-blurb">
        Mozilla uses Stripe for secure payment processing.
        <br />
        View the <a href="https://stripe.com/privacy">Stripe privacy policy</a>.
      </div>
    </form>
  );
};

const InjectedPaymentForm = injectStripe(PaymentForm);

const WrappedPaymentForm = (props: PaymentFormProps) => (
  <Elements>
    <InjectedPaymentForm {...props} />
  </Elements>
);

export default WrappedPaymentForm;
