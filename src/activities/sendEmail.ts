import { ApplicationFailure } from "@temporalio/activity";
import { ERRORS } from "./types";


interface ResendSuccessResponse {
  id: string;
}

const EMAIL_SERVICE_URL = 'https://api.resend.com/emails';

/**
 * Sends a delivery delay notification email to a customer using Resend's email API.
 */
export async function sendEmail(recipientEmail: string, message: string, destinationAddress: string): Promise<{ messageId: string; }> {

  const apiKey = process.env.EMAIL_SERVICE_API_URL;
  const deliveryUpdateEmail = process.env.DELIVERY_UPDATE_EMAIL;

  if (!apiKey || !deliveryUpdateEmail) {
    throw new ApplicationFailure('Missing environment variable.', ERRORS.MISSING_ENVIRONMENT_VARIABLE, true);
  }

  const requestBody = {
    from: `Titan Freight Co <${deliveryUpdateEmail}>`,
    to: [recipientEmail],
    subject: `Delay in your delivery to ${destinationAddress}`,
    html: `<p>${message}</p>`,
  };

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  };
  const response = await fetch(EMAIL_SERVICE_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  });


  const data = await response.json();
  if (!response.ok) {
    throw new ApplicationFailure('Failed to send email.', ERRORS.API_FAILED, false, [data]);
  }

  return { messageId: (data as ResendSuccessResponse).id };

}
