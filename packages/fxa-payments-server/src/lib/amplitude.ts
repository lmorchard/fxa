import { logAmplitudeEvent } from './flow-event';
import * as Sentry from '@sentry/browser';
import { config } from './config';

const eventGroupNames = {
  createSubscription: 'subPaySetup',
  updatePayment: 'subPayManage',
  cancelSubscription: 'subCancel',
  manageSubscriptions: 'subManage',
} as const;

const eventTypeNames = {
  view: 'view',
  engage: 'engage',
  submit: 'submit',
  success: 'success',
  fail: 'fail',
  complete: 'complete',
} as const;

type EventProperties = {
  planId?: string;
  plan_id?: string;
  productId?: string;
  product_id?: string;
  error?: Error;
};

type Error = { message?: string } | null;

// This should help ensure failure to log an Amplitude event doesn't
// derail what we're instrumenting.
const safeLogAmplitudeEvent = (
  groupName: string,
  eventName: string,
  perfStartTime: number,
  eventProperties: object
) => {
  try {
    logAmplitudeEvent(
      groupName,
      eventName,
      perfStartTime,
      normalizeEventProperties(eventProperties)
    );
  } catch (e) {
    console.error('AppError', e);
    Sentry.captureException(e);
  }
};

// Accepting both planId & plan_id allows us to directly use a Plan type
// as EventProperties
const normalizeEventProperties = (eventProperties: EventProperties) => {
  const {
    error = undefined,
    planId = undefined,
    plan_id = undefined,
    productId = undefined,
    product_id = undefined,
    ...otherEventProperties
  } = eventProperties;

  return {
    planId: planId || plan_id,
    productId: productId || product_id,
    reason: error && error.message ? error.message : undefined,
    ...otherEventProperties,
  };
};

export function manageSubscriptionsMounted(eventProperties: EventProperties) {
  safeLogAmplitudeEvent(
    eventGroupNames.manageSubscriptions,
    eventTypeNames.view,
    config.perfStartTime,
    {}
  );
}

export function manageSubscriptionsEngaged(eventProperties: EventProperties) {
  safeLogAmplitudeEvent(
    eventGroupNames.manageSubscriptions,
    eventTypeNames.engage,
    config.perfStartTime,
    {}
  );
}

export function createSubscriptionMounted(eventProperties: EventProperties) {
  safeLogAmplitudeEvent(
    eventGroupNames.createSubscription,
    eventTypeNames.view,
    config.perfStartTime,
    eventProperties
  );
}

export function createSubscriptionEngaged(eventProperties: EventProperties) {
  safeLogAmplitudeEvent(
    eventGroupNames.createSubscription,
    eventTypeNames.engage,
    config.perfStartTime,
    eventProperties
  );
}

export function createSubscription_PENDING(eventProperties: EventProperties) {
  safeLogAmplitudeEvent(
    eventGroupNames.createSubscription,
    eventTypeNames.submit,
    config.perfStartTime,
    eventProperties
  );
}

export function createSubscription_FULFILLED(eventProperties: EventProperties) {
  safeLogAmplitudeEvent(
    eventGroupNames.createSubscription,
    eventTypeNames.success,
    config.perfStartTime,
    eventProperties
  );
  safeLogAmplitudeEvent(
    eventGroupNames.createSubscription,
    eventTypeNames.complete,
    config.perfStartTime,
    eventProperties
  );
}

export function createSubscription_REJECTED(eventProperties: EventProperties) {
  safeLogAmplitudeEvent(
    eventGroupNames.createSubscription,
    eventTypeNames.fail,
    config.perfStartTime,
    eventProperties
  );
}

export function updatePaymentMounted(eventProperties: EventProperties) {
  safeLogAmplitudeEvent(
    eventGroupNames.updatePayment,
    eventTypeNames.view,
    config.perfStartTime,
    eventProperties
  );
}

export function updatePaymentEngaged(eventProperties: EventProperties) {
  safeLogAmplitudeEvent(
    eventGroupNames.updatePayment,
    eventTypeNames.engage,
    config.perfStartTime,
    eventProperties
  );
}

export function updatePayment_PENDING(eventProperties: EventProperties) {
  safeLogAmplitudeEvent(
    eventGroupNames.updatePayment,
    eventTypeNames.submit,
    config.perfStartTime,
    eventProperties
  );
}

export function updatePayment_FULFILLED(eventProperties: EventProperties) {
  safeLogAmplitudeEvent(
    eventGroupNames.updatePayment,
    eventTypeNames.success,
    config.perfStartTime,
    eventProperties
  );
  safeLogAmplitudeEvent(
    eventGroupNames.updatePayment,
    eventTypeNames.complete,
    config.perfStartTime,
    eventProperties
  );
}

export function updatePayment_REJECTED(eventProperties: EventProperties) {
  safeLogAmplitudeEvent(
    eventGroupNames.updatePayment,
    eventTypeNames.fail,
    config.perfStartTime,
    eventProperties
  );
}

export function cancelSubscriptionMounted(eventProperties: EventProperties) {
  safeLogAmplitudeEvent(
    eventGroupNames.cancelSubscription,
    eventTypeNames.view,
    config.perfStartTime,
    eventProperties
  );
}

export function cancelSubscriptionEngaged(eventProperties: EventProperties) {
  safeLogAmplitudeEvent(
    eventGroupNames.cancelSubscription,
    eventTypeNames.engage,
    config.perfStartTime,
    eventProperties
  );
}

export function cancelSubscription_PENDING(eventProperties: EventProperties) {
  safeLogAmplitudeEvent(
    eventGroupNames.cancelSubscription,
    eventTypeNames.submit,
    config.perfStartTime,
    eventProperties
  );
}

export function cancelSubscription_FULFILLED(eventProperties: EventProperties) {
  safeLogAmplitudeEvent(
    eventGroupNames.cancelSubscription,
    eventTypeNames.success,
    config.perfStartTime,
    eventProperties
  );
  safeLogAmplitudeEvent(
    eventGroupNames.cancelSubscription,
    eventTypeNames.complete,
    config.perfStartTime,
    eventProperties
  );
}

export function cancelSubscription_REJECTED(eventProperties: EventProperties) {
  safeLogAmplitudeEvent(
    eventGroupNames.cancelSubscription,
    eventTypeNames.fail,
    config.perfStartTime,
    eventProperties
  );
}
