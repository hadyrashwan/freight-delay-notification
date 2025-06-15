import { describe, it } from 'mocha';
import { OpenAIClientImpl } from '../../activities/openAIClient';
import assert from 'assert';
import { setupMocks } from './mocks';
import { ApplicationFailure } from '@temporalio/activity';

describe('OpenAIClient', () => {
  setupMocks();

  it('returns a message on successful API call', async () => {
    const client = new OpenAIClientImpl('test-key');
    const message = await client.getMessage(300, 'origin', 'destination');
    assert.equal(typeof message, 'string');
  });

  it('throws an error on failed API call', async () => {
    const client = new OpenAIClientImpl('test-key');
    await assert.rejects(
      async () => {
        await client.getMessage(300, 'origin', 'fail');
      },
      (err: any) => {
        assert.ok(err instanceof ApplicationFailure);
        assert.equal(err.message, 'Request to the LLM API failed');
        assert.equal(err.type, 'API_FAILED');
        return true;
      }
    );
  });
});
