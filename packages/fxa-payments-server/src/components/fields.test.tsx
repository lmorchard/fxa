import React, { useState, useCallback, useContext, useRef } from 'react';
import { render, cleanup, fireEvent, prettyDOM } from '@testing-library/react';
import 'jest-dom/extend-expect';
import { FieldGroup, Form, FormContext, FormContextValue, Field } from './fields';
import { useValidatorState, Validator } from '../lib/validator';

afterEach(cleanup);

describe('Form', () => {
  it('renders a form that provides children with a validator', () => {
    const { container, getByTestId } = render(
      <TestForm>
        <TestValidatorState />
      </TestForm>
    );
    expect(container.querySelector('form')).not.toBeNull();
    expect(getByTestId('validator').textContent).toEqual(JSON.stringify(
      { "error": null, "fields": {} }
    ));
  });
});

describe('FieldGroup', () => {
  it('wraps children in className="input-row-group"', () => {
    const { container } = render(
      <FieldGroup>
        <div>Hi mom</div>
      </FieldGroup>
    );
    const groupEl = container.querySelector('.input-row-group');
    expect(groupEl).not.toBeNull();
  })
});

describe('Field', () => {
  it('renders a label when available', () => {
    const { container } = render(
      <TestForm>
        <Field fieldType="input" name="foo" label="This is a label">
          <p>Hi mom</p>
        </Field>
        <TestValidatorState />
      </TestForm>
    );
    const label = container.querySelector('label .label-text');
    expect(label).not.toBeNull();
    if (label) {
      expect(label.textContent).toEqual('This is a label');
    }
  });

  it('renders a tooltip for errors', () => {
    const Subject = () => {
      const tooltipParentRef = useRef<HTMLDivElement>(null);
      return (
        <TestForm>
          <Field fieldType="input" name="foo" label="This is a label" tooltip={true} tooltipParentRef={tooltipParentRef}>
            <p ref={tooltipParentRef}>Hi mom</p>
          </Field>
          <TestValidatorFn fn={validator => {
            validator.updateField({ name: 'foo', value: 'bar', valid: false, error: 'This is an error' })
          }} />
          <TestValidatorState />
        </TestForm>
      );
    };
    const { container, queryAllByTestId } = render(<Subject />);
    queryAllByTestId('execute').forEach(fireEvent.click);
    const tooltip = container.querySelector('aside.tooltip');
    expect(tooltip).not.toBeNull();
  });

  it('registers a field with validator state', () => {
    const { getByTestId } = render(
      <TestForm>
        <Field fieldType="input" name="foo">
          <p>Hi mom</p>
        </Field>
        <TestValidatorState />
      </TestForm>
    );
    const validatorState = parseEl(getByTestId('validator'));
    expect(validatorState.fields.foo).toEqual({
      fieldType: "input",
      required: false,
      value: null, 
      valid: null,
      error: null
    });
  });
});

describe('Input', () => {
  it.todo('accepts a function to validate its value on change');
  it.todo('enforces required fields');
});

describe('StripeElement', () => {
  it.todo('handles self-validation by contained stripe element');
  it.todo('uses _ref as the tooltip parent reference');
});

describe('Checkbox', () => {
  it.todo('must be checked to be valid when required');
});

describe('SubmitButton', () => {
  it.todo('is disabled if all fields are not valid');
});

const parseEl = ({ textContent }: HTMLElement) =>
  typeof textContent !== 'string' || textContent === ''
    ? undefined
    : JSON.parse(textContent);

const TestValidatorState = () => {
  const { validator } = useContext(FormContext) as FormContextValue;      
  return <div data-testid="validator">{JSON.stringify(validator.state)}</div>;
};

const TestForm = ({ children } : { children: React.ReactNode }) => {
  const validator = useValidatorState();
  return (
    <Form validator={validator}>
      {children}
    </Form>
  );
};

const TestValidatorFn = ({ fn }: { fn: (validator: Validator) => any }) => {
  const { validator } = useContext(FormContext) as FormContextValue;      
  const [ result, setResult ] = useState('');
  const onClick = useCallback(
    (ev) => {
      ev.preventDefault();
      setResult(JSON.stringify(fn(validator)));
    },
    [ setResult, fn, validator ]
  );
  return (
    <div>
      <button data-testid="execute" onClick={onClick}>Execute</button>
      <pre data-testid="result">{result}</pre>
    </div>
  )
};