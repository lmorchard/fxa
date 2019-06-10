import React, { useContext, useCallback, useRef, useEffect, DetailedHTMLProps, FormHTMLAttributes } from 'react';
import { ReactStripeElements } from 'react-stripe-elements';
import classNames from 'classnames';
import { Validator, FieldType } from './validator';
import Tooltip from '../components/Tooltip';

type FormContextValue = { validator: Validator };
export const FormContext = React.createContext<FormContextValue | null>(null);

type FormProps = {
  children: React.ReactNode,
  validator: Validator,
} & DetailedHTMLProps<FormHTMLAttributes<HTMLFormElement>, HTMLFormElement>;

export const Form = (props: FormProps) => {
  const {
    children,
    validator,
    ...formProps
  } = props;
  return (
    <form {...formProps}>
      <FormContext.Provider value={{ validator }}>
        {children}
      </FormContext.Provider>
    </form>
  );
};

type FieldGroupProps = { children: React.ReactNode };

export const FieldGroup = ({ children }: FieldGroupProps) => (
  <div className="input-row-group">
    {children}
  </div>
);

type FieldProps = {
  name: string,
  tooltip?: boolean,
  required?: boolean,
  label?: string | React.ReactNode,
  className?: string,
};

type FieldHOCProps = {
  fieldType: FieldType,
  tooltipParentRef?: React.MutableRefObject<any>,
  children: React.ReactNode,
} & FieldProps;

export const Field = ({
  tooltipParentRef,
  fieldType,
  name,
  tooltip = true,
  required = false,
  label,
  className='input-row',
  children,
}: FieldHOCProps) => {
  const { validator } = useContext(FormContext) as FormContextValue;

  // Disabling lint rule because registering a field changes the validator
  // instance, so including validator in list of deps causes an infinite loop
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(
    () => validator.registerField({ name, required, fieldType }),
    [ name, required, fieldType ]
  );
  /* eslint-enable react-hooks/exhaustive-dep */

  return (
    <div className={className}>
      <label>
        {label && <span className="label-text">{label}</span>}
        {children}
        {tooltip && tooltipParentRef && validator.getError(name) &&
          <Tooltip parentRef={tooltipParentRef}>{validator.getError(name)}</Tooltip>}
      </label>
    </div>
  );
};

type InputProps =
  { validate?: (value: any) => { value: any, error: any } } &
  FieldProps &
  React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;

export const Input = (props: InputProps) => {
  const { validate, name, label, tooltip = true, required = false, className, ...childProps } = props;
  const { validator } = useContext(FormContext) as FormContextValue;

  const onChange = useCallback(
    (ev) => {
      const { value } = ev.target;
      if (validate) {
        const { value: newValue, error } = validate(value);
        validator.updateField({ name, value: newValue, error, valid: error === null });
      } else if (required && value !== null && ! value) {
        validator.updateField({ name, value, error: 'This field is required' });
      } else {
        validator.updateField({ name, value, valid: true });
      }
    },
    [ name, validator ]
  );

  const tooltipParentRef = useRef<HTMLInputElement>(null);

  return (
    <Field {...{ fieldType: 'input', tooltipParentRef, name, tooltip, required, label, className }}>
      <input {...{
        ...childProps,
        ref: tooltipParentRef,
        name,
        required,
        className: classNames({ invalid: validator.isInvalid(name) }),
        value: validator.getValue(name, ''),
        onChange: onChange,
        onBlur: onChange,
      }} />
    </Field>
  );
};

type StripeElementProps = FieldProps &
  { component: any } &
  ReactStripeElements.ElementProps;

export const StripeElement = (props: StripeElementProps) => {
  const {
    component: StripeElementComponent,
    name, tooltip = true,
    required = false,
    label,
    className,
    ...childProps
  } = props;
  const { validator } = useContext(FormContext) as FormContextValue;

  const onChange = useCallback(
    (value: stripe.elements.ElementChangeResponse) => {
      if (value !== null) {
        if (value.error && value.error.message) {
          validator.updateField({ name, value, error: value.error.message });
        } else if (value.complete) {
          validator.updateField({ name, value, valid: true });
        }
      }
    },
    [ name, validator ]
  );

  const tooltipParentRef = useRef<any>(null);
  const stripeElementRef = (el: any) => {
    // HACK: Stripe elements stash their underlying DOM element in el._ref,
    // but we need it for Tooltip positioning
    if (el) {
      tooltipParentRef.current = el._ref;
    }
  };

  return (
    <Field {...{ fieldType: 'stripe', tooltipParentRef, name, tooltip, required, label, className }}>
      <StripeElementComponent {...{
        ...childProps,
        ref: stripeElementRef,
        onChange
      }} />
    </Field>
  );
 }

type CheckboxProps = FieldProps &
  React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;

export const Checkbox = (props: CheckboxProps) => {
  const {
    name,
    label,
    required = false,
    className='input-row input-row--checkbox',
    ...childProps
  } = props;
  const { validator } = useContext(FormContext) as FormContextValue;

  const onChange = useCallback(
    (ev) => {
      const value = ev.target.checked;
      if (required && ! value) {
        validator.updateField({ name, value, valid: false });
      } else {
        validator.updateField({ name, value, valid: true });
      }
    },
    [ name, validator ]
  );

  return (
    <Field {...{ fieldType: 'input', name, className, required, tooltip: false }}>
      <input {...{ ...childProps, type: 'checkbox', name, onChange, onBlur: onChange, }} />
      <span className="label-text checkbox">{label}</span>
    </Field>
  );
};

type SubmitButtonProps = FieldProps &
  { children: React.ReactNode } &
  React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>;

export const SubmitButton = (props: SubmitButtonProps) => {
  const { name, label, children, className = 'button-row', ...childProps } = props;
  const { validator } = useContext(FormContext) as FormContextValue;
  return (
    <Field {...{ fieldType: 'input', name, label, className, tooltip: false }}>
      <button {...{ ...childProps, type: 'submit', name, disabled: (! validator.allValid()) }}>
        {children}
      </button>
    </Field>
  );
};