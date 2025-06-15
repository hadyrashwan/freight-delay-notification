import { proxyActivities, defineSignal, setHandler, condition, log, uuid4 } from '@temporalio/workflow';
import type * as activities from './activities';

export const manualDelayOverrideSignal = defineSignal<[number]>('manualDelayOverride');
export const manualConfirmationSignal = defineSignal<[]>('manualConfirmation');

// Can be added to environment variables for more control
const MAX_ATTEMPTS = 5
const ACTIVITY_TIMEOUT = '1 minute'

const { getDelay } = proxyActivities<typeof activities>({
  startToCloseTimeout: ACTIVITY_TIMEOUT,
  retry: {
    maximumAttempts: MAX_ATTEMPTS,
  },
});

const { validateEnv } = proxyActivities<typeof activities>({
  startToCloseTimeout: ACTIVITY_TIMEOUT,
  retry: {
    maximumAttempts: MAX_ATTEMPTS,
  },
});

const { getDefaultMessage } = proxyActivities<typeof activities>({
  startToCloseTimeout: ACTIVITY_TIMEOUT,
});

const { getMessage } = proxyActivities<typeof activities>({
  startToCloseTimeout: ACTIVITY_TIMEOUT,
  retry: {
    maximumAttempts: MAX_ATTEMPTS,
  },
});

const { sendEmail } = proxyActivities<typeof activities>({
  startToCloseTimeout: ACTIVITY_TIMEOUT,
  retry: {
    maximumAttempts: MAX_ATTEMPTS,
  },
});

/**
 * Generates a message based on traffic delay and route information.
 * 
 * This function attempts to generate a custom message using `getMessage`.
 * If the primary message generation fails (e.g., due to an error such as
 * network issues, service downtime, or unexpected exceptions), it gracefully
 * falls back to a default message using `getDefaultMessage`.
 * 
 */
export async function delayNotification(
  recipientEmail: string,
  originAddress: string,
  destinationAddress: string,
  delayThresholdInSeconds: number,
  waypoints?: string[],
  departureTimeISO?: string,
) {
  await validateEnv();

  const { trafficDelayInSeconds } = await handleGetDelay(originAddress, destinationAddress, { waypoints, departureTimeISO });
  const isDelayed = trafficDelayInSeconds >= delayThresholdInSeconds;

  console.log('Traffic Delay calculated', trafficDelayInSeconds);
  console.log('Is delivery delayed ?', isDelayed)

  if(!isDelayed){
    return { isDelayed };
  }

  const { message } = await handleMessageGeneration(trafficDelayInSeconds, originAddress, destinationAddress);
  const { messageId } = await handleSendEmail(recipientEmail, message, destinationAddress);

  console.log('Email send', messageId);
  
  return { messageId, message, trafficDelayInSeconds, isDelayed };
}

/**
 * Attempts to generate a customer-facing delivery delay message using an LLM.
 *
 * This function first tries to call an LLM API to generate a personalized message
 * about the traffic delay. If the LLM call fails,
 * it gracefully falls back to a predefined default message template.
 */
export async function handleMessageGeneration(
  trafficDelayInSeconds: number,
  originAddress: string,
  destinationAddress: string,
):Promise<{message: string}> {
  let message
  try {
    
    const response = await getMessage(trafficDelayInSeconds, originAddress, destinationAddress);
    console.log('Message generated');
    message = response.message;

  } catch (error) {

    console.error(error);
    
    const response = await getDefaultMessage(trafficDelayInSeconds, originAddress, destinationAddress);
    console.log('Using the default message');
    message = response.message;

  }

  console.log('Email body', message);
  return {message};
}

export async function handleGetDelay(
  originAddress: string,
  destinationAddress: string,
  options: { waypoints?: string[]; departureTimeISO?: string },
): Promise<{ trafficDelayInSeconds: number }> {
  let trafficDelayInSeconds: number | undefined;
  let manualOverride = false;

  setHandler(manualDelayOverrideSignal, (delay) => {
    trafficDelayInSeconds = delay;
    manualOverride = true;
  });

  try {
    const result = await getDelay(originAddress, destinationAddress, options);
    trafficDelayInSeconds = result.trafficDelayInSeconds;
  } catch (error) {
    console.error('Failed to get delay automatically', error);
    await condition(() => manualOverride, '24 hours');
  }

  if (trafficDelayInSeconds === undefined) {
    throw new Error('Failed to get traffic delay, and no manual override was provided.');
  }

  return { trafficDelayInSeconds };
}

export async function handleSendEmail(
  recipientEmail: string,
  message: string,
  destinationAddress: string,
): Promise<{ messageId: string | undefined }> {
  let messageId: string | undefined;
  let manualConfirmation = false;

  setHandler(manualConfirmationSignal, () => {
    manualConfirmation = true;
  });

  try {
    const result = await sendEmail(recipientEmail, message, destinationAddress);
    messageId = result.messageId;
  } catch (error) {
    log.error('Failed to send email automatically', { error });
    await condition(() => manualConfirmation, '24 hours');
    if (manualConfirmation) {
      messageId = `manual-${uuid4()}`;
    }
  }

  return { messageId };
}
