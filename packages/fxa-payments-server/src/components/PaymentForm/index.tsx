import React, { useCallback } from 'react';
import {
  injectStripe,
  CardNumberElement,
  CardExpiryElement,
  CardCVCElement,
  Elements,
  ReactStripeElements
} from 'react-stripe-elements';
import { Form, FieldGroup, Input, StripeElement, SubmitButton, Checkbox } from './fields';
import { useFormValidator } from './validator';

import './index.scss';

// ref: https://stripe.com/docs/stripe-js/reference#the-elements-object
const STRIPE_ELEMENT_STYLES = {
  base: {
    //TODO: Figure out what this really should be - I just copied it from computed styles because CSS can't apply through the iframe
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
    fontSize: '16px',
    lineHeight: '48px',
  }
};

export type PaymentFormProps = {
  onPayment: (tokenResponse: stripe.TokenResponse) => void,
  onPaymentError: (error: any) => void,
} & ReactStripeElements.InjectedStripeProps;

export const PaymentForm = ({
  onPayment,
  onPaymentError,
  stripe,
}: PaymentFormProps) => {
  const validator = useFormValidator();

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
  }, [ onPayment, onPaymentError, stripe ]);

  return (
    <Form validator={validator} onSubmit={onSubmit} className="payment">
      {/* TODO: global validator function as Form prop, per-field validator as field prop! */}
      <h3><span>Billing information</span></h3>

      <Input type="text" name="name" label="Name as it appears on your card"
        required autoFocus spellCheck={false} />

      <FieldGroup>

        <StripeElement component={CardNumberElement}
          name="creditCardNumber" label="Credit Card Number"
          style={STRIPE_ELEMENT_STYLES}
          className="input-row input-row--xl" required />

        <StripeElement component={CardExpiryElement}
          name="expDate" label="Exp. Date"
          style={STRIPE_ELEMENT_STYLES} required />

        <StripeElement component={CardCVCElement}
          name="cvc" label="CVC"
          style={STRIPE_ELEMENT_STYLES} required />

        <Input type="number" name="zip" label="Zip Code" maxLength={5} required />

      </FieldGroup>
     
      <Checkbox name="confirm" required label={`
        I authorize Mozilla, maker of Firefox products, to charge my
        payment method [cost] per [time frame], according to payment
        terms, until I cancel my subscription.
      `} />

      <SubmitButton name="submit">Submit</SubmitButton>

    </Form>
  );
};

const InjectedPaymentForm = injectStripe(PaymentForm);

const WrappedPaymentForm = (props: PaymentFormProps) => (
  <Elements>
    <InjectedPaymentForm {...props} />
  </Elements>
);

export default WrappedPaymentForm;
