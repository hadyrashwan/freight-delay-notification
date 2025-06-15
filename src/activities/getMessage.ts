import { OpenAIClient } from "./openAIClient";

export function createGetMessage(openAIClient: OpenAIClient) {
  return async function getMessage(delayInSeconds: number, originAddress: string, destinationAddress: string): Promise<{ message: string; }> {
    const message = await openAIClient.getMessage(delayInSeconds, originAddress, destinationAddress);
    return { message };
  }
}

export async function getDefaultMessage(delayInSeconds: number, originAddress: string, destinationAddress: string): Promise<{ message: string; }> {
  const delayInMinutes = Math.round(delayInSeconds / 60);
  const message = `We wanted to inform you that your delivery from ${originAddress} to ${destinationAddress} is experiencing a slight delay due to unexpected traffic. The delay is approximately ${delayInMinutes} minutes. We appreciate your understanding and are working hard to get your order to you as quickly as possible!`;
  return { message };
}
