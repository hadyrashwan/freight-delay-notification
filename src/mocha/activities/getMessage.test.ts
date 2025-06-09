import { MockActivityEnvironment } from '@temporalio/testing';
import { describe, it } from 'mocha';
import * as activities from '../../activities';
import assert from 'assert';
import { setupMocks } from './mocks';

describe('getMessage Activity', () => {
  setupMocks();
  let originalApiKey: string | undefined;

  beforeEach(() => {
    originalApiKey = process.env.LLM_API_KEY;
  });

  afterEach(() => {
    process.env.LLM_API_KEY = originalApiKey;
  });

  it('returns an object with message on success', async () => {
    process.env.LLM_API_KEY = 'test-key';
    const env = new MockActivityEnvironment();
    const result = (await env.run(activities.getMessage, 100, 'origin', 'destination')) as { message: string };
    assert.equal(typeof result, 'object');
    assert.equal(result.message, 'This is a mocked AI message from Titan Freight Co.');
  });

  it('throws an error on fetch failure', async () => {
    process.env.LLM_API_KEY = 'test-key';
    const env = new MockActivityEnvironment();
    await assert.rejects(
      async () => {
        await env.run(activities.getMessage, 100, 'origin', 'fail');
      },
      (err: any) => {
        assert.ok(err instanceof Error);
        assert.ok(err.message.includes('Request to the LLM API failed'));
        return true;
      }
    );
  });

  it('throws an error if LLM_API_KEY is not set', async () => {
    const env = new MockActivityEnvironment();
    delete process.env.LLM_API_KEY;

    await assert.rejects(
      async () => {
        await env.run(activities.getMessage, 100, 'origin', 'destination');
      },
      (err: any) => {
        assert.ok(err.message.includes('Missing the API Key configuration.'));
        return true;
      }
    );
  });
});
