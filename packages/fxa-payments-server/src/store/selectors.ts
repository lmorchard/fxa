import {
  State,
  Plan,
} from './types';

export const profile = (state: State) => state.api.profile;
export const token = (state: State) => state.api.token;
export const subscriptions = (state: State) => state.api.subscriptions;
export const plans = (state: State) => state.api.plans;
export const createSubscriptionStatus = (state: State) => state.api.createSubscription;
export const cancelSubscriptionStatus = (state: State) => state.api.cancelSubscription;

export const lastError = (state: State) => Object
    .entries(state.api)
    .filter(([k, v]) => v && !! v.error)
    .map(([k, v]) => [k, v.error])[0];

export const isLoading = (state: State) => Object
    .values(state.api)
    .some(v => v && !! v.loading);

export const products = (state: State): string[] => {
  const result = plans(state).result || [];
  return Array.from(
    new Set(
      result.map((plan: Plan) => plan.product_id)
    )
  );
};

export const plansByProductId = (state: State) =>
  (productId: string): Array<Plan> => {
    const result = plans(state).result || [];
    return productId
      ? result.filter((plan: Plan) => plan.product_id === productId)
      : result;
  };
