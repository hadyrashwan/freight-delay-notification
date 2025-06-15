import { describe, it } from 'mocha';
import { ResendClientImpl } from '../../activities/resendClient';
import assert from 'assert';
import { setupMocks } from './mocks';
import { ApplicationFailure } from '@temporalio/activity';

describe('ResendClient', () => {
  setupMocks();

  it('returns message ID on successful API call', async () => {
    const client = new ResendClientImpl('test-key', 'test@example.com');
    const messageId = await client.sendEmail('recipient@example.com', 'test message', 'destination');
    assert.equal(messageId, 'mocked_message_id');
  });

  it('throws an error on failed API call', async () => {
    const client = new ResendClientImpl('test-key', 'test@example.com');
    await assert.rejects(
      async () => {
        await client.sendEmail('fail@example.com', 'test message', 'destination');
      },
      (err: any) => {
        assert.ok(err instanceof ApplicationFailure);
        assert.equal(err.message, 'Failed to send email.');
        assert.equal(err.type, 'API_FAILED');
        return true;
      }
    );
  });
});
