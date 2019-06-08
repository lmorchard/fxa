import React, { useContext, useRef, useEffect, DetailedHTMLProps, FormHTMLAttributes } from 'react';
import { Validator } from './validator';
import Tooltip from '../Tooltip';

type FormProps = {
  children: React.ReactNode,
  validator: Validator,
} & DetailedHTMLProps<FormHTMLAttributes<HTMLFormElement>, HTMLFormElement>;

type FormContextType = {
  validator?: Validator,
};

export const FormContext = React.createContext<FormContextType>({});

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
}

type FieldGroupProps = {
  children: React.ReactNode,
};

export const FieldGroup = ({
  children,
}: FieldGroupProps) => (
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
  children: (props: InputPropsType) => React.ReactNode,
};

export const Field = ({
  name,
  tooltip = true,
  required = false,
  label,
  className='input-row',
  children,
}: FieldProps) => {
  const { validator } = useContext(FormContext);
  const ref = useRef<any>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const props = inputProps(ref, name, validator);

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(
    () => validator && validator.initializeField({ name, required }),
    [ name, required ]
  );
  /* eslint-enable react-hooks/exhaustive-deps */

  return (
    <div className={className}>
      <label>
        {label && <span className="label-text">{label}</span>}
        {children(props)}
        {tooltip && props.hasError() && <Tooltip {...{ parentRef: ref }}>{props.error()}</Tooltip>}
      </label>
    </div>
  );
};

type InputPropsType = {
  ref: React.MutableRefObject<any>,
  allValid: () => boolean,
  hasError: () => boolean,
  error: () => string | null,
  invalid: () => boolean,
  value: (defVal: any) => any,
  onInputChange: (ev: React.ChangeEvent<HTMLInputElement>) => void,
  onCheckboxChange: (ev: React.ChangeEvent<HTMLInputElement>) => void,
  onStripeChange: (ev: stripe.elements.ElementChangeResponse) => void,
};

const inputProps = (
  ref: React.MutableRefObject<any>,
  name: string,
  validator: Validator | undefined,
): InputPropsType => validator ? ({
  ref,
  allValid: () => validator.allValid(),
  hasError: () => validator.hasError(name),
  error: () => validator.getError(name),
  invalid: () => validator.isInvalid(name),
  value: (defVal) => validator.getValue(name, defVal),
  onInputChange: validator.onInputChange(name),
  onCheckboxChange: validator.onCheckboxChange(name),
  onStripeChange: validator.onStripeChange(name),
}) : ({
  ref,
  allValid: () => false,
  hasError: () => false,
  error: () => null,
  invalid: () => false,
  value: () => null,
  onInputChange: () => {},
  onCheckboxChange: () => {},
  onStripeChange: () => {},
});
