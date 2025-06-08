import { proxyActivities } from '@temporalio/workflow';
import { ERRORS } from './types';
// Only import the activity types
import type * as activities from './activities';

const { greet } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
});

const { getDelay } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
  retry: {
    maximumAttempts: 5,
    nonRetryableErrorTypes: [ERRORS.MISSING_ENVIRONMENT_VARIABLE],
  },
});

const { getMessage } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
  retry: {
    maximumAttempts: 5,
    nonRetryableErrorTypes: [ERRORS.MISSING_ENVIRONMENT_VARIABLE],
  },
});

const { sendEmail } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
  retry: {
    maximumAttempts: 5,
    nonRetryableErrorTypes: [ERRORS.MISSING_ENVIRONMENT_VARIABLE],
  },
});

/** A workflow that simply calls an activity */
export async function example(name: string): Promise<string> {
  return await greet(name);
}

export async function delayNotification(
  recipientEmail: string,
  originAddress: string,
  destinationAddress: string,
  delayThresholdInSeconds: number,
  waypoints?: string[],
  departureTimeISO?: string,
) {
  const { trafficDelayInSeconds } = await getDelay(originAddress, destinationAddress, { waypoints, departureTimeISO });
  const isDelayed =  trafficDelayInSeconds >= delayThresholdInSeconds
  if (isDelayed) {
    const { message } = await getMessage(trafficDelayInSeconds, originAddress, destinationAddress);
    const { messageId } = await sendEmail(recipientEmail, message, destinationAddress);
    return { messageId, message, trafficDelayInSeconds , isDelayed};
  }else{
    return {isDelayed}
  }
}
