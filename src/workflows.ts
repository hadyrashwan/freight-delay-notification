import { proxyActivities } from '@temporalio/workflow';
import type * as activities from './activities';

// Can be added to environment variables for more control
const MAX_ATTEMPTS = 5
const ACTIVITY_TIMEOUT = '1 minute'

const { getDelay } = proxyActivities<typeof activities>({
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
  const { trafficDelayInSeconds } = await getDelay(originAddress, destinationAddress, { waypoints, departureTimeISO });
  const isDelayed = trafficDelayInSeconds >= delayThresholdInSeconds;

  console.log('Traffic Delay calculated', trafficDelayInSeconds);
  console.log('Is delivery delayed ?', isDelayed)

  if(!isDelayed){
    return { isDelayed };
  }

  const { message } = await handleMessageGeneration(trafficDelayInSeconds, originAddress, destinationAddress);
  const { messageId } = await sendEmail(recipientEmail, message, destinationAddress);

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
async function handleMessageGeneration(
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
