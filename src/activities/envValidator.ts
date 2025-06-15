import { ActivityDependencies } from '../lib/utils';

export async function validateEnv(): Promise<boolean> {
  const deps = new ActivityDependencies();
  const requiredEnvVars = [
    { name: 'TRAFFIC_API_KEY', message: 'Missing TRAFFIC_API_KEY configuration.' },
    { name: 'EMAIL_SERVICE_API_KEY', message: 'Missing EMAIL_SERVICE_API_KEY configuration.' },
    { name: 'DELIVERY_UPDATE_EMAIL', message: 'Missing DELIVERY_UPDATE_EMAIL configuration.' },
    { name: 'LLM_API_KEY', message: 'Missing LLM_API_KEY configuration.' },
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar.name]) {
      throw deps.applicationError.create(envVar.message, 'MISSING_ENVIRONMENT_VARIABLE', true);
    }
  }

  return true;
}
