import { proxyActivities } from '@temporalio/workflow';
import type * as activities from './activities';

const { getDelay } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
  retry: {
    maximumAttempts: 5,
  },
});

const { getDefaultMessage } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
});

const { getMessage } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
  retry: {
    maximumAttempts: 5,
  },
});

const { sendEmail } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
  retry: {
    maximumAttempts: 5,
  },
});

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
  let message
  if (isDelayed) {

    message = await handleMessageGeneration(trafficDelayInSeconds, originAddress, destinationAddress, message);

    const { messageId } = await sendEmail(recipientEmail, message, destinationAddress);
    return { messageId, message, trafficDelayInSeconds , isDelayed};
  }else{
    return {isDelayed}
  }
}
async function handleMessageGeneration(trafficDelayInSeconds: number, originAddress: string, destinationAddress: string, message: any) {
  try {
    const response = await getMessage(trafficDelayInSeconds, originAddress, destinationAddress);
    message = response.message;
  } catch (error) {
    console.error(error);
    const response = await getDefaultMessage(trafficDelayInSeconds, originAddress, destinationAddress);
    message = response.message;
  }
  return message;
}

