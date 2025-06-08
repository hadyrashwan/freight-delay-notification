import { ApplicationFailure } from "@temporalio/activity";
import { ERRORS } from './types'

const TRAFFIC_API_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes'

const LLM_API_URL = 'https://api.openai.com/v1/chat/completions';

const EMAIL_SERVICE_URL = 'https://api.resend.com/emails';



type GoogleRoutesResponse = {
  routes: {
    duration: string;
    staticDuration: string;
  }[];
};


export async function getDelay(originAddress: string,destinationAddress:string,options?:{
waypoints?:string[],
departureTimeISO?: string,
}): Promise<{
  trafficDelayInSeconds: number
}> {

  // Environment variables can be moved to be loaded at the worker level and injected to the activity
  const apiKey = process.env.TRAFFIC_API_KEY;
  
  if (!apiKey) {
  // ApplicationFailure can be abstracted away to reduce coupling.
  throw new ApplicationFailure('Missing the API Key configuration.',ERRORS.MISSING_ENVIRONMENT_VARIABLE)
}

  // Google api specific logic can be abstracted away to reduce coupling.
  const intermediates = []
  if (options && options.waypoints && options.waypoints.length > 0) {
    const waypoints = options.waypoints.map(address => ({ address }));
    intermediates.push(...waypoints)
  }

  const headers = {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': apiKey,
    'X-Goog-FieldMask': 'routes.duration,routes.staticDuration',
  };

  const body = {
    origin: { address: originAddress },
    destination: { address: destinationAddress },
    travelMode: 'DRIVE',
    routingPreference: 'TRAFFIC_AWARE',
    intermediates,
    departureTime:  options?.departureTimeISO,
  };


  const httpResponse = await fetch(TRAFFIC_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const responseBody =  await httpResponse.json() as GoogleRoutesResponse
    console.log('Traffic API response', responseBody)

    if(!httpResponse.ok){
      throw new ApplicationFailure('Request to traffic api failed',ERRORS.API_FAILED,null,[responseBody,{status: httpResponse.status}])
    }

    const route = responseBody.routes[0];
    const durationWithTrafficSec = parseInt(route.duration.slice(0, -1), 10);
    const staticDurationSec = parseInt(route.staticDuration.slice(0, -1), 10);
    const trafficDelayInSeconds = Math.round((durationWithTrafficSec - staticDurationSec));
    console.log({durationWithTrafficSec,staticDurationSec,trafficDelayInSeconds})

  return {
        trafficDelayInSeconds,
    }
}

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

export async function getMessage(delayInSeconds: number,originAddress:string,destinationAddress:string): Promise<{message: string}> {

  const apiKey =  process.env.LLM_API_KEY

  if (!apiKey) {
    throw new ApplicationFailure('Missing the API Key configuration.',ERRORS.MISSING_ENVIRONMENT_VARIABLE,true)
  }

    const requestBody = {
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: "You are a friendly customer support assistant for a delivery service called Titan Freight Co. Your tone is apologetic but reassuring. Write short, friendly messages (2-3 sentences). Do not include a formal greeting like 'Hello' or a signature like 'Thank you'."
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
      throw new ApplicationFailure('Request to the LLM api failed',ERRORS.API_FAILED,null,[data])
    }
    
    const generatedMessage = data.choices[0].message.content.trim();

    return { message:generatedMessage};

}

export interface ResendSuccessResponse {
  id: string;
}
export async function sendEmail(recipientEmail:string,message:string,destinationAddress:string): Promise<{messageId: string}> {

    const apiKey = process.env.EMAIL_SERVICE_API_URL
    const deliveryUpdateEmail = process.env.DELIVERY_UPDATE_EMAIL

    if (!apiKey || !deliveryUpdateEmail) {
    throw new ApplicationFailure('Missing environment variable.',ERRORS.MISSING_ENVIRONMENT_VARIABLE, true)
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


    const data = await response.json() 
    if (!response.ok) {
      throw new ApplicationFailure('Failed to send email.',ERRORS.API_FAILED,false,[data])
    }

    return { messageId: (data as ResendSuccessResponse).id };

}

export async function greet(name: string): Promise<string> {
  return `Hello, ${name}!`;
}
