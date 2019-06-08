import React, { useCallback } from 'react';
import classNames from 'classnames';
import {
  injectStripe,
  CardNumberElement,
  CardExpiryElement,
  CardCVCElement,
  Elements,
  ReactStripeElements
} from 'react-stripe-elements';
import { Form, Field, FieldGroup } from './fields';
import { useFormValidator, ValidatorStateType } from './validator';

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

function validate(state: ValidatorStateType) {
  const { fields } = state;
  
  if (typeof fields.name.value !== 'undefined') {
    if (fields.confirm.value === true) {
      fields.confirm.valid = true;
    }
    if (fields.zip.value) {
      fields.zip.valid = true;
    }
    if (! fields.name.value) {
      fields.name.error = 'Please enter your name';
    } else {
      fields.name = { ...fields.name, error: null, valid: true };
    }
  }

  return state;
}

export type PaymentFormProps = {
  onPayment: (tokenResponse: stripe.TokenResponse) => void,
  onPaymentError: (error: any) => void,
} & ReactStripeElements.InjectedStripeProps;

export const PaymentForm = ({
  onPayment,
  onPaymentError,
  stripe,
}: PaymentFormProps) => {
  const validator = useFormValidator(validate);

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
      <h3><span>Billing information</span></h3>

      <Field name="name" label="Name as it appears on your card" required>
        {({ ref, invalid, value, onInputChange }) => (
          <input
            ref={ref} type="text"
            className={classNames({ invalid: invalid() })}
            value={value('')} spellCheck={false} required autoFocus 
            onChange={onInputChange}
            onBlur={onInputChange} />
        )}
      </Field>

      <FieldGroup>

        <Field name="creditCardNumber" label="Credit Card Number" className="input-row input-row--xl" required>
          {({ ref, onStripeChange }) => (
            <CardNumberElement
              ref={ref}
              style={STRIPE_ELEMENT_STYLES}
              onChange={onStripeChange} />
          )}
        </Field>

        <Field name="expDate" label="Exp. Date" required>
          {({ ref, onStripeChange }) => (
            <CardExpiryElement
              ref={ref}
              style={STRIPE_ELEMENT_STYLES}
              onChange={onStripeChange} />
          )}
        </Field>

        <Field name="cvc" label="CVC" required>
          {({ ref, onStripeChange }) => (
            <CardCVCElement
              ref={ref}
              style={STRIPE_ELEMENT_STYLES}
              onChange={onStripeChange} />
          )}
        </Field>

        <Field name="zip" label="Zip Code" required>
          {({ ref, invalid, value, onInputChange }) => (
            <input
              ref={ref} name="zip" type="number" maxLength={5}
              className={classNames({ invalid: invalid() })}
              value={value('')} spellCheck={false} required
              onChange={onInputChange} />
          )}
        </Field>

      </FieldGroup>
     
      <Field name="confirm" className="input-row input-row--checkbox" required tooltip={false}>
        {({ onCheckboxChange }) => <>
          <input type="checkbox" onChange={onCheckboxChange} />
          <span className="label-text disclaimer">
            I authorize Mozilla, maker of Firefox products, to charge my
            payment method [cost] per [time frame], according to payment
            terms, until I cancel my subscription.
          </span>
        </>}
      </Field>

      <Field name="submit" className="button-row" tooltip={false}>
        {({ allValid }) => (
          <button id="submit-btn" type="submit" disabled={! allValid()}>Submit</button>
        )}
      </Field>

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
