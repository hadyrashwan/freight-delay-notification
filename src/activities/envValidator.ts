import { createApplicationFailure } from "./errors";

export async function validateEnv(): Promise<boolean> {
  if (!process.env.TRAFFIC_API_KEY) {
    throw createApplicationFailure('Missing TRAFFIC_API_KEY configuration.', 'MISSING_ENVIRONMENT_VARIABLE');
  }
  if (!process.env.EMAIL_SERVICE_API_KEY) {
    throw createApplicationFailure('Missing EMAIL_SERVICE_API_KEY configuration.', 'MISSING_ENVIRONMENT_VARIABLE');
  }
  if (!process.env.DELIVERY_UPDATE_EMAIL) {
    throw createApplicationFailure('Missing DELIVERY_UPDATE_EMAIL configuration.', 'MISSING_ENVIRONMENT_VARIABLE');
  }
  if (!process.env.LLM_API_KEY) {
    throw createApplicationFailure('Missing LLM_API_KEY configuration.', 'MISSING_ENVIRONMENT_VARIABLE');
  }
  return true;
}
