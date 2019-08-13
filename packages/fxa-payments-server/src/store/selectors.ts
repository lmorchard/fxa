import {
  State,
  Plan,
} from './types';

const selectors = {
  profile: (state: State) => state.api.profile,
  token: (state: State) => state.api.token,
  subscriptions: (state: State) => state.api.subscriptions,
  plans: (state: State) => state.api.plans,
  customer: (state: State) => state.api.customer,
  createSubscriptionStatus: (state: State) => state.api.createSubscription,
  cancelSubscriptionStatus: (state: State) => state.api.cancelSubscription,
  reactivateSubscriptionStatus: (state: State) => state.api.reactivateSubscription,
  updatePaymentStatus: (state: State) => state.api.updatePayment,

  lastError: (state: State) =>
    Object.entries(state.api)
      .filter(([k, v]) => v && !!v.error)
      .map(([k, v]) => [k, v.error])[0],

  isLoading: (state: State) => Object.values(state.api).some(v => v && !!v.loading),

  plansByProductId: (state: State) => (productId: string): Array<Plan> => {
    const plans = selectors.plans(state).result || [];
    return productId
      ? plans.filter((plan: Plan) => plan.product_id === productId)
      : plans;
  },

  customerSubscriptions: (state: State) => {
    const customer = selectors.customer(state);
    if (customer && customer.result && customer.result.subscriptions) {
      return customer.result.subscriptions;
    }
    return [];
  },
};

export default selectors;
