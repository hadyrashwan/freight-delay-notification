export const ERRORS = {
  API_FAILED: 'API_FAILED',
  MISSING_ENVIRONMENT_VARIABLE: 'MISSING_ENVIRONMENT_VARIABLE'
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
