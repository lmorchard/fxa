import { useReducer, useMemo } from 'react';

export const useFormValidator = (): Validator => {
  // TODO: Accept a reducer parameter to wrap baseReducer and enable overall form-level validation?
  const [ state, dispatch ] = useReducer(baseReducer, initialState);
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

  getFields(): { [name: string]: any } {
    return Object
      .entries(this.state.fields)
      .reduce((acc, [ name, field ]) => ({ ...acc, [ name ]: field.value }), {});
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

  updateField(
    { name, value, valid, error = null }:
    { name: string, value: any, valid?: boolean, error?: any}
  ) {
    if (typeof valid === 'undefined') {
      valid = !! error;
    }
    return this.dispatch({ type: 'updateField', name, value, valid, error });
  }

  hasField(name: string) {
    return name in this.state.fields;
  }

  getField(name: string) {
    return this.state.fields[name] || {};
  }
  
  getValue(name: string, defVal: any) {
    return (this.hasField(name) && this.getField(name).value) || defVal;
  }

  isInvalid(name: string) {
    return this.hasField(name) && this.getField(name).valid === false;
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
  | { type: 'updateField', name: string, value: any, valid: boolean, error: any }
  | { type: 'setGlobalError', error: any }
  | { type: 'resetGlobalError' };

type ActionReducer = (state: State, action: Action) => State;

const baseReducer: ActionReducer = (state, action) => {
  state = actionReducer(state, action);
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
    case 'updateField': {
      const { name, value, valid, error } = action;
      return setFieldState(state, name, field =>
        ({ ...field, value, valid, error }));
    }
    case 'setGlobalError': {
      const { error } = action;
      return ({ ...state, error });
    }
    case 'resetGlobalError': {
      return ({ ...state, error: null });
    }
  }
  return state;
};
