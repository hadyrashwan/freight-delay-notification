import { ResendClient } from "./resendClient";

export function createSendEmail(resendClient: ResendClient) {
  return async function sendEmail(recipientEmail: string, message: string, destinationAddress: string): Promise<{ messageId: string; }> {
    const messageId = await resendClient.sendEmail(recipientEmail, message, destinationAddress);
    return { messageId };
  }
}
