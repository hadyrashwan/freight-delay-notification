import { ActivityDependencies } from '../lib/utils';

interface ResendSuccessResponse {
  id: string;
}

const EMAIL_SERVICE_URL = 'https://api.resend.com/emails';

export interface ResendClient {
  sendEmail(recipientEmail: string, message: string, destinationAddress: string): Promise<string>;
}

export class ResendClientImpl implements ResendClient {
  private readonly apiKey: string;
  private readonly deliveryUpdateEmail: string;
  private readonly deps: ActivityDependencies;

  constructor(apiKey: string, deliveryUpdateEmail: string, deps: ActivityDependencies = new ActivityDependencies()) {
    this.apiKey = apiKey;
    this.deliveryUpdateEmail = deliveryUpdateEmail;
    this.deps = deps;
  }

  async sendEmail(recipientEmail: string, message: string, destinationAddress: string): Promise<string> {
    const requestBody = {
      from: `Titan Freight Co <${this.deliveryUpdateEmail}>`,
      to: [recipientEmail],
      subject: `Delay in your delivery to ${destinationAddress}`,
      html: `<p>${message}</p>`,
    };

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
    };
    const response = await fetch(EMAIL_SERVICE_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    if (!response.ok) {
      this.deps.logger.error('Failed to send email', { data });
      throw this.deps.applicationError.create('Failed to send email.', 'API_FAILED', true);
    }

    this.deps.logger.log('Email sent successfully', { data });
    return (data as ResendSuccessResponse).id;
  }
}
