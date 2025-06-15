import { ApplicationFailure } from '@temporalio/activity';
import { ERRORS } from './types';

export function createApplicationFailure(message: string, type: keyof typeof ERRORS, details?: any) {
  return ApplicationFailure.create({ message, type, details, nonRetryable: true });
}
