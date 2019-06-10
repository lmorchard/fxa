import React, { useState, useCallback, useContext } from 'react';
import { render, cleanup, fireEvent } from '@testing-library/react';
import 'jest-dom/extend-expect';
import { useValidatorState, Validator } from './validator';
import { string } from 'prop-types';

afterEach(cleanup);

it('should execute test code', () => {
  const { results, state } = runAgainstValidator(
    v => v.registerField({ name: 'foo', fieldType: 'input', required: true }),
    v => v.updateField({ name: 'foo', value: 'bar' }),
    v => v.getFieldProp('foo', 'value'),
  );
});

const runAgainstValidator = (...fns: Array<(validator: Validator) => any>) => {
  const { queryAllByTestId, getByTestId } = render(
    <TestContainer>
      {fns.map(fn => <TestFn execute={fn} /> )}
    </TestContainer>
  );
  queryAllByTestId('execute').forEach(fireEvent.click);
  return {
    results: queryAllByTestId('result').map(el => el.textContent),
    state: getByTestId('validatorState').textContent,
  };
}

type TestContextValue = { validator: Validator };
const TestContext = React.createContext<TestContextValue | null>(null);

const TestContainer = ({ children }: { children: React.ReactNode }) => {
  const validator = useValidatorState();
  return (
    <TestContext.Provider value={{ validator }}>
      {children}
      <pre data-testid="validatorState">{JSON.stringify(validator.state)}</pre>
    </TestContext.Provider>
  );
};

const TestFn = ({ execute }: { execute: (validator: Validator) => any }) => {
  const { validator } = useContext(TestContext) as TestContextValue;
  const [ executeState, setExecuteState ] = useState(null);
  const onClick = useCallback(
    () => setExecuteState(execute(validator)),
    [ execute, validator ]
  );
  return (
    <div>
      <button data-testid="execute" onClick={onClick}>Execute test function</button>
      <pre data-testid="result">{JSON.stringify(executeState)}</pre>
    </div>
  )
};