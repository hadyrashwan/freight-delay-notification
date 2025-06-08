import { ApplicationFailure } from "@temporalio/activity";
import { ERRORS } from "./types";

const LLM_API_URL = 'https://api.openai.com/v1/chat/completions';
interface OpenAiMessage {
  role: 'assistant';
  content: string;
}
interface OpenAiChoice {
  index: number;
  message: OpenAiMessage;
  finish_reason: string;
}

export interface OpenAiApiResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: OpenAiChoice[];
}

export async function getDefaultMessage(delayInSeconds: number, originAddress: string, destinationAddress: string): Promise<{ message: string; }> {

  const delayInMinutes = Math.round(delayInSeconds / 60);
  const message = `We wanted to inform you that your delivery from ${originAddress} to ${destinationAddress} is experiencing a slight delay due to unexpected traffic. The delay is approximately ${delayInMinutes} minutes. We appreciate your understanding and are working hard to get your order to you as quickly as possible!`;

  return { message };
}

export async function getMessage(delayInSeconds: number, originAddress: string, destinationAddress: string): Promise<{ message: string; }> {

  const apiKey = process.env.LLM_API_KEY;

  if (!apiKey) {
    throw new ApplicationFailure('Missing the API Key configuration.', ERRORS.MISSING_ENVIRONMENT_VARIABLE, true);
  }

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
    'Authorization': `Bearer ${apiKey}`
  };

    const response = await fetch(LLM_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    const data = await response.json() as OpenAiApiResponse;
    if (!response.ok) {
      throw new ApplicationFailure('Request to the LLM API failed', ERRORS.API_FAILED, false, [data]);
    }

    const generatedMessage = data.choices[0].message.content.trim();
    return { message: generatedMessage };
}
