import { ActivityDependencies } from '../lib/utils';
import { OpenAiApiResponse } from './types';

const LLM_API_URL = 'https://api.openai.com/v1/chat/completions';

export interface OpenAIClient {
  getMessage(delayInSeconds: number, originAddress: string, destinationAddress: string): Promise<string>;
}

export class OpenAIClientImpl implements OpenAIClient {
  private readonly apiKey: string;
  private readonly deps: ActivityDependencies;

  constructor(apiKey: string, deps: ActivityDependencies = new ActivityDependencies()) {
    this.apiKey = apiKey;
    this.deps = deps;
  }

  async getMessage(delayInSeconds: number, originAddress: string, destinationAddress: string): Promise<string> {
    const requestBody = {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: "You are a friendly customer support assistant for a delivery service called Titan Freight Co. Your tone is apologetic but reassuring. Write short, friendly messages (2-3 sentences). Do not include a formal greeting like 'Hello' or a signature like 'Thank you'. Make sure to mention that This is an AI generated message and the name of the company"
        },
        {
          role: 'user',
          content: `A customer's delivery from ${originAddress} to ${destinationAddress} is delayed by approximately ${delayInSeconds} in seconds due to unexpected traffic. Please write the notification email letting them know about the delay in minutes.`
        }
      ],
      temperature: 0.7,
      max_tokens: 80,
    };

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`
    };

    const response = await fetch(LLM_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    const data = (await response.json()) as OpenAiApiResponse;
    if (!response.ok) {
      this.deps.logger.error('Request to the LLM API failed', { data });
      throw this.deps.applicationError.create('Request to the LLM API failed', 'API_FAILED', true);
    }

    const generatedMessage = data.choices[0].message.content.trim();
    this.deps.logger.log('Message generated successfully', { generatedMessage });
    return generatedMessage;
  }
}
