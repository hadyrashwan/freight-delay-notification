import { MockActivityEnvironment } from '@temporalio/testing';
import { describe, it } from 'mocha';
import { validateEnv } from '../../activities/envValidator';
import assert from 'assert';
import { ApplicationFailure } from '@temporalio/activity';

describe('validateEnv Activity', () => {
  let originalTrafficApiKey: string | undefined;
  let originalEmailApiKey: string | undefined;
  let originalDeliveryEmail: string | undefined;
  let originalLlmApiKey: string | undefined;

  beforeEach(() => {
    originalTrafficApiKey = process.env.TRAFFIC_API_KEY;
    originalEmailApiKey = process.env.EMAIL_SERVICE_API_KEY;
    originalDeliveryEmail = process.env.DELIVERY_UPDATE_EMAIL;
    originalLlmApiKey = process.env.LLM_API_KEY;
  });

  afterEach(() => {
    process.env.TRAFFIC_API_KEY = originalTrafficApiKey;
    process.env.EMAIL_SERVICE_API_KEY = originalEmailApiKey;
    process.env.DELIVERY_UPDATE_EMAIL = originalDeliveryEmail;
    process.env.LLM_API_KEY = originalLlmApiKey;
  });

  it('returns true if all environment variables are set', async () => {
    const env = new MockActivityEnvironment();
    process.env.TRAFFIC_API_KEY = 'test-key';
    process.env.EMAIL_SERVICE_API_KEY = 'test-key';
    process.env.DELIVERY_UPDATE_EMAIL = 'test-email';
    process.env.LLM_API_KEY = 'test-key';
    const result = await env.run(validateEnv);
    assert.equal(result, true);
  });

  it('throws an error if TRAFFIC_API_KEY is not set', async () => {
    const env = new MockActivityEnvironment();
    delete process.env.TRAFFIC_API_KEY;

    await assert.rejects(
      async () => {
        await env.run(validateEnv);
      },
      (err: any) => {
        assert.ok(err instanceof ApplicationFailure);
        assert.equal(err.message, 'Missing TRAFFIC_API_KEY configuration.');
        assert.equal(err.type, 'MISSING_ENVIRONMENT_VARIABLE');
        return true;
      }
    );
  });
});
