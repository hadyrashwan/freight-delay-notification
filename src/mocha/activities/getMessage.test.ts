import { MockActivityEnvironment } from '@temporalio/testing';
import { describe, it } from 'mocha';
import { createGetMessage } from '../../activities/getMessage';
import { OpenAIClient } from '../../activities/openAIClient';
import assert from 'assert';
import { ApplicationFailure } from '@temporalio/activity';

describe('getMessage Activity', () => {
  it('returns an object with message on success', async () => {
    const env = new MockActivityEnvironment();
    const mockOpenAIClient: OpenAIClient = {
      getMessage: async () => 'test message',
    };
    const getMessage = createGetMessage(mockOpenAIClient);
    const result = await env.run(getMessage, 100, 'origin', 'destination');
    assert.deepStrictEqual(result, { message: 'test message' });
  });

  it('throws an error on fetch failure', async () => {
    const env = new MockActivityEnvironment();
    const mockOpenAIClient: OpenAIClient = {
      getMessage: async () => {
        throw new ApplicationFailure('Request to the LLM API failed');
      },
    };
    const getMessage = createGetMessage(mockOpenAIClient);
    await assert.rejects(
      async () => {
        await env.run(getMessage, 100, 'origin', 'fail');
      },
      (err: any) => {
        assert.ok(err instanceof ApplicationFailure);
        assert.equal(err.message, 'Request to the LLM API failed');
        return true;
      }
    );
  });
});
