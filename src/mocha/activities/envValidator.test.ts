import { MockActivityEnvironment } from '@temporalio/testing';
import { describe, it } from 'mocha';
import { validateEnv } from '../../activities/envValidator';
import assert from 'assert';
import { ApplicationFailure } from '@temporalio/activity';

describe('validateEnv Activity', () => {
  let originalApiKey: string | undefined;

  beforeEach(() => {
    originalApiKey = process.env.TRAFFIC_API_KEY;
  });

  afterEach(() => {
    process.env.TRAFFIC_API_KEY = originalApiKey;
  });

  it('returns true if TRAFFIC_API_KEY is set', async () => {
    const env = new MockActivityEnvironment();
    process.env.TRAFFIC_API_KEY = 'test-key';
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
