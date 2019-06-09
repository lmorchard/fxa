import { useReducer, useMemo, useEffect } from 'react';

export const useFormValidator = (): Validator => {
  const [ state, dispatch ] = useReducer(mainReducer, initialState);
  return useMemo(
    () => new Validator(state, dispatch),
    [ state, dispatch ]
  );
};

export class Validator {
  state: State;
  dispatch: React.Dispatch<Action>;

  constructor(state: State, dispatch: React.Dispatch<Action>) {
    this.state = state;
    this.dispatch = dispatch;
  }

  allValid() {
    return Object
      .values(this.state.fields)
      .filter(field => field.required)
      .every(field => field.valid === true);
  }

  registerField(
    { name, fieldType, required}:
    { name: string, fieldType: FieldType, required: boolean}
  ) {
    this.dispatch({ type: 'registerField', name, fieldType, required });
  }

  hasField(name: string) {
    return name in this.state.fields;
  }

  getField(name: string) {
    return this.state.fields[name] || {};
  }

  setValue(name: string, value: any) {
    this.dispatch({ type: 'setFieldValue', name, value });
  }
  
  getValue(name: string, defVal: any) {
    return (this.hasField(name) && this.getField(name).value) || defVal;
  }

  setValidity(name: string, valid: boolean) {
    this.dispatch({ type: 'setFieldValidity', name, valid });
  }

  isInvalid(name: string) {
    return this.hasField(name) && this.getField(name).valid === false;
  }

  setError(name: string, error: any) {
    this.dispatch({ type: 'setFieldError', name, error });
  }

  hasError(name: string) {
    return this.hasField(name) && !! this.getField(name).error;
  }

  getError(name: string) {
    return this.hasField(name) && this.getField(name).error;
  }

  getGlobalError() {
    return this.state.error;
  }

  setGlobalError(error: any) {
    this.dispatch({ type: 'setGlobalError', error });
  }

  resetGlobalError(error: any) {
    this.dispatch({ type: 'resetGlobalError' });
  }
}

type State = {
  error: any,
  fields: { [name: string]: FieldState },
};

export type FieldType = 'input' | 'stripe';

type FieldState = {
  fieldType: FieldType,
  value: any,
  required: boolean,
  valid: boolean | null,
  error: string | null,
};

const initialState: State = {
  error: null,
  fields: {},
};

type Action =
  | { type: 'registerField', name: string, fieldType: FieldType, required: boolean }
  | { type: 'setFieldValue', name: string, value: any }
  | { type: 'setFieldValidity', name: string, valid: boolean }
  | { type: 'setFieldError', name: string, error: any }
  | { type: 'setGlobalError', error: any }
  | { type: 'resetGlobalError' };

type Reducer = (state: State) => State;

type ActionReducer = (state: State, action: Action) => State;

const mainReducer: ActionReducer = (state, action) => {
  state = actionReducer(state, action);
  state = requiredInputValidationReducer(state);
  state = stripeElementValidationReducer(state);
  return state;
};

const setFieldState = (state: State, name: string, fn: (field: FieldState) => FieldState) => ({
  ...state,
  fields: {
    ...state.fields,
    [ name ]: fn(state.fields[name])
  }
});

const actionReducer: ActionReducer = (state, action) => {
  switch (action.type) {
    case 'registerField': {
      const { name, fieldType, required } = action;
      return setFieldState(state, name, () =>
        ({ fieldType, required, value: null, valid: null, error: null }));
    }
    case 'setFieldValue': {
      const { name, value } = action;
      return setFieldState(state, name, field =>
          ({ ...field, value }));
    }
    case 'setFieldError': {
      const { name, error } = action;
      return setFieldState(state, name, field =>
        ({ ...field, valid: false, error }));
    }
    case 'setFieldValidity': {
      const { name, valid } = action;
      return setFieldState(state, name, field =>
        ({ ...field, valid, error: null }));
    }
    case 'setGlobalError': {
      const { error } = action;
      return ({ ...state, error });
    }
    case 'resetGlobalError': {
      return ({ ...state, error: null });
    }
  }
};

const requiredInputValidationReducer: Reducer = (state) => {
  const fields = Object
    .entries(state.fields)
    .filter(([ _, field ]) => field.fieldType === 'input');

  for (const [ name, field ] of fields) {
    const { required, value } = field;
    if (required && value !== null && ! value) {
      state = actionReducer(state, { name, type: 'setFieldError', error: 'This field is required' });
    } else {
      state = actionReducer(state, { name, type: 'setFieldValidity', valid: true });
    }
  }
  
  return state;
};

const stripeElementValidationReducer: Reducer = (state) => {
  const fields = Object
    .entries(state.fields)
    .filter(([ _, field ]) => field.fieldType === 'stripe');

  for (const [ name, field ] of fields) {
    const value: stripe.elements.ElementChangeResponse = field.value;
    if (value !== null) {
      if (value.complete) {
        state = actionReducer(state, { name, type: 'setFieldValidity', valid: true });
      } else if (value.error && value.error.message) {
        state = actionReducer(state, { name, type: 'setFieldError', error: value.error.message });
      }
    }
  };

  return state;
};
