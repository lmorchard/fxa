import { Selector, Plan, CustomerSubscription } from './types';

export const profile: Selector = state => state.api.profile;
export const token: Selector = state => state.api.token;
export const subscriptions: Selector = state => state.api.subscriptions;
export const plans: Selector = state => state.api.plans;
export const customer: Selector = state => state.api.customer;

export const createSubscriptionStatus: Selector = state =>
  state.api.createSubscription;
export const cancelSubscriptionStatus: Selector = state =>
  state.api.cancelSubscription;
export const reactivateSubscriptionStatus: Selector = state =>
  state.api.reactivateSubscription;
export const updatePaymentStatus: Selector = state => state.api.updatePayment;

export type PlansByProductIdSelected = (id: string) => Array<Plan>;

export const plansByProductId: Selector = (state): PlansByProductIdSelected => (
  productId: string
): Array<Plan> => {
  const fetchedPlans = plans(state).result || [];
  return fetchedPlans.filter((plan: Plan) => plan.product_id === productId);
};

export type CustomerSubscriptionsSelected = Array<CustomerSubscription> | null;

export const customerSubscriptions: Selector = (
  state
): CustomerSubscriptionsSelected => {
  const fetchedCustomer = customer(state);
  if (
    fetchedCustomer &&
    fetchedCustomer.result &&
    fetchedCustomer.result.subscriptions
  ) {
    return fetchedCustomer.result.subscriptions;
  }
  return null;
};
