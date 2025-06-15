import { ActivityDependencies } from '../lib/utils';
import { GoogleMapsClientImpl } from './googleMapsClient';
import { createGetDelay } from './getDelay';
import { ResendClientImpl } from './resendClient';
import { createSendEmail } from './sendEmail';
import { OpenAIClientImpl } from './openAIClient';
import { createGetMessage, getDefaultMessage } from './getMessage';
import { validateEnv } from './envValidator';

const deps = new ActivityDependencies();

const googleMapsClient = new GoogleMapsClientImpl(process.env.TRAFFIC_API_KEY!, deps);
const resendClient = new ResendClientImpl(process.env.EMAIL_SERVICE_API_KEY!, process.env.DELIVERY_UPDATE_EMAIL!, deps);
const openAIClient = new OpenAIClientImpl(process.env.LLM_API_KEY!, deps);

export const getDelay = createGetDelay(googleMapsClient);
export const sendEmail = createSendEmail(resendClient);
export const getMessage = createGetMessage(openAIClient);
export { getDefaultMessage, validateEnv };
