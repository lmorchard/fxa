import { useReducer, useMemo } from 'react';

export enum FieldTypeNames { inputField, stripeField }

type BaseFieldState = {
  fieldType?: any,
  value?: any,
  required: boolean,
  valid: boolean | null,
  error: string | null,
};

type InputFieldState = BaseFieldState & {
  fieldType: FieldTypeNames.inputField,
};

type StripeFieldState = BaseFieldState & { 
  fieldType: FieldTypeNames.stripeField,
  value?: stripe.elements.ElementChangeResponse,
};

type FieldState = BaseFieldState | InputFieldState | StripeFieldState;

enum ActionTypes {
  initializeField,
  changeField,
  appendGlobalError,
  resetGlobalError,
};

type InitializeInputFieldActionType = {
  type: ActionTypes.initializeField,
  name: string,
  required: boolean,
};

type BaseChangeActionType = {
  type: ActionTypes.changeField,
  name: string,
};

type ChangeInputFieldActionType = BaseChangeActionType & {
  type: ActionTypes.changeField,
  fieldType: FieldTypeNames.inputField,
  value: any
};

type ChangeStripeFieldActionType = BaseChangeActionType & {
  type: ActionTypes.changeField,
  fieldType: FieldTypeNames.stripeField,
  value: stripe.elements.ElementChangeResponse
};

type AppendGlobalErrorActionType = {
  type: ActionTypes.appendGlobalError,
  value: string,
};

type ResetGlobalErrorActionType = {
  type: ActionTypes.resetGlobalError,
};

type ActionType = 
  InitializeInputFieldActionType
  | ChangeInputFieldActionType
  | ChangeStripeFieldActionType
  | AppendGlobalErrorActionType
  | ResetGlobalErrorActionType;

export type ValidatorStateType = {
  errors: string[],
  fields: { [name: string]: FieldState },
};

const initialState: ValidatorStateType = {
  errors: [],
  fields: {},
};

type ValidatorReducer = 
  (oldState: ValidatorStateType, action: ActionType) => ValidatorStateType;

const reducer: ValidatorReducer = (oldState, action) => {  
  const state = {
    errors: oldState.errors,
    fields: { ...oldState.fields }
  };

  switch(action.type) {
    case ActionTypes.appendGlobalError:
      state.errors.push(action.value);
      break;
   
    case ActionTypes.resetGlobalError:
      state.errors.length = 0;
      break;

    case ActionTypes.initializeField:
      state.fields[action.name] = {
        required: action.required,
        valid: null,
        error: null,
      };
      break;

    case ActionTypes.changeField:
      state.fields[action.name] = {
        ...state.fields[action.name],
        fieldType: action.fieldType,
        value: action.value,
        valid: null,
        error: null
      };
      break;  
  }

  // Process validation state from self-validating Stripe elements
  const fields = Object.entries(state.fields);
  const stripeFields = fields.filter(([ _, field ]) =>
      field.fieldType && field.fieldType === FieldTypeNames.stripeField);
  for (const [ name, field ] of stripeFields) {
    const value: stripe.elements.ElementChangeResponse = field.value;
    if (value.complete) {
      state.fields[name] = {
        ...field,
        valid: true,
        error: null,
      };
    } else if (value.error && value.error.message) {
      state.fields[name] = {
        ...field,
        valid: false,
        error: value.error.message,
      };
    }      
  }

  return state;
}

type ValidatorFunction = (state: ValidatorStateType) => ValidatorStateType;

export interface Validator {
  state: ValidatorStateType,
  dispatch: React.Dispatch<ActionType>,
  allValid: () => boolean,
  initializeField: (props: { name: string, required?: boolean }) => void,
  appendError: (value: string) => void;
  resetErrors: () => void;
  getValue: (name: string, defVal?: any) => any;
  isInvalid: (name: string) => boolean;
  hasError: (name: string) => boolean;  
  getError: (name: string) => string | null;
  onInputChange: (name: string) => (ev: React.ChangeEvent<HTMLInputElement>) => void;
  onCheckboxChange: (name: string) => (ev: React.ChangeEvent<HTMLInputElement>) => void;
  onStripeChange: (name: string) => (ev: stripe.elements.ElementChangeResponse) => void;
}

export const useFormValidator = (validator?: ValidatorFunction): Validator => {
  const validatedReducer = useMemo<ValidatorReducer>(
    () => validator
      ? (state, action) => validator(reducer(state, action)) 
      : reducer,
    [ validator ]
  );
  
  const [ state, dispatch ] = useReducer(validatedReducer, initialState);

  return useMemo<Validator>(() => ({
    state,
    dispatch,

    allValid: () => Object
      .values(state.fields)
      .filter(field => field.required)
      .every(field => field.valid === true),

    getValue: (name, defVal) => (state.fields[name] && state.fields[name].value) || defVal,
    isValid: name => state.fields[name] && state.fields[name].valid === true,
    isInvalid: name => state.fields[name] && state.fields[name].valid === false,
    hasError: name => state.fields[name] && !! state.fields[name].error,
    getError: name => state.fields[name] && state.fields[name].error,
    appendError: value => dispatch({ type: ActionTypes.appendGlobalError, value }),
    resetErrors: () => dispatch({ type: ActionTypes.resetGlobalError }),

    initializeField: ({ name, required = false }) => dispatch({
      type: ActionTypes.initializeField,
      name,
      required,
    }),

    onInputChange: name => ev => dispatch({
      type: ActionTypes.changeField,
      fieldType: FieldTypeNames.inputField,
      name,
      value: ev.target.value,
    }),

    onCheckboxChange: name => ev => dispatch({
      type: ActionTypes.changeField,
      fieldType: FieldTypeNames.inputField,
      name,
      value: ev.target.checked,
    }),

    onStripeChange: name => ev => dispatch({
      type: ActionTypes.changeField,
      fieldType: FieldTypeNames.stripeField,
      name,
      value: ev,
    }),
  }), [ state, dispatch ]);
};
