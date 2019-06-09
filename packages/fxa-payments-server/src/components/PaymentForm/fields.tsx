import React, { useContext, useCallback, useRef, useEffect, DetailedHTMLProps, FormHTMLAttributes } from 'react';
import { ReactStripeElements } from 'react-stripe-elements';
import classNames from 'classnames';
import { Validator, FieldType } from './validator';
import Tooltip from '../Tooltip';

type FormContextType = { validator: Validator };

export const FormContext = React.createContext<FormContextType | null>(null);

type FormProps = {
  children: React.ReactNode,
  validator: Validator,
} & DetailedHTMLProps<FormHTMLAttributes<HTMLFormElement>, HTMLFormElement>;

export const Form = (props: FormProps) => {
  const {
    validator,
    children,
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
  const { validator } = useContext(FormContext) as FormContextType;
  useEffect(
    () => validator.initializeField({ name, required, fieldType }),
    [ name, required ]
  );
  return (
    <div className={className}>
      <label>
        {label && <span className="label-text">{label}</span>}
        {children}
        {tooltip && tooltipParentRef && validator.hasError(name) &&
          <Tooltip parentRef={tooltipParentRef}>{validator.getError(name)}</Tooltip>}
      </label>
    </div>
  );
};

type InputProps = FieldProps &
  React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;

export const Input = (props: InputProps) => {
  const {
    name,
    label,
    tooltip = true,
    required = false,
    className,
    ...childProps
  } = props;
  const { validator } = useContext(FormContext) as FormContextType;
  const onChange = useCallback(
    (ev) => validator.setValue(name, ev.target.value),
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
    component: ChildElement,
    name,
    tooltip = true,
    required = false,
    label,
    className,
    ...childProps
  } = props;
  const { validator } = useContext(FormContext) as FormContextType;
  const onChange = useCallback(
    (ev) => validator.setValue(name, ev),
    [ name, validator ]
  );
  const tooltipParentRef = useRef<any>(null);
  return (
    <Field {...{ fieldType: 'stripe', tooltipParentRef, name, tooltip, required, label, className }}>
      <ChildElement {...{
        ...childProps,
        ref: tooltipParentRef,
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
  const { validator } = useContext(FormContext) as FormContextType;
  const onChange = useCallback(
    (ev) => validator.setValue(name, ev.target.checked),
    [ name, validator ]
  );
  return (
    <Field {...{ fieldType: 'input', name, className, required, tooltip: false }}>
      <input {...{
        ...childProps,
        type: 'checkbox',
        name,
        onChange,
        onBlur: onChange,
      }} />
      <span className="label-text checkbox">{label}</span>
    </Field>
  );
};

type SubmitButtonProps = FieldProps &
  { children: React.ReactNode } & 
  React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>;

export const SubmitButton = (props: SubmitButtonProps) => {
  const {
    name,
    label,
    children,
    className = 'button-row',
    ...childProps
  } = props;
  const { validator } = useContext(FormContext) as FormContextType;
  return (
    <Field {...{ fieldType: 'input', name, label, className, tooltip: false }}>
      <button {...{
        ...childProps,
        type: 'submit',
        name,
        disabled: (! validator.allValid())
      }}>{children}</button>
    </Field>
  );
};