import { MockActivityEnvironment } from '@temporalio/testing';
import { describe, it } from 'mocha';
import { createSendEmail } from '../../activities/sendEmail';
import { ResendClient } from '../../activities/resendClient';
import assert from 'assert';
import { ApplicationFailure } from '@temporalio/activity';

describe('sendEmail Activity', () => {
  it('returns an object with messageId on success', async () => {
    const env = new MockActivityEnvironment();
    const mockResendClient: ResendClient = {
      sendEmail: async () => 'test-message-id',
    };
    const sendEmail = createSendEmail(mockResendClient);
    const result = await env.run(sendEmail, 'test@example.com', 'Test Subject', 'Test Body');
    assert.deepStrictEqual(result, { messageId: 'test-message-id' });
  });

  it('throws an error on fetch failure', async () => {
    const env = new MockActivityEnvironment();
    const mockResendClient: ResendClient = {
      sendEmail: async () => {
        throw new ApplicationFailure('Failed to send email.');
      },
    };
    const sendEmail = createSendEmail(mockResendClient);
    await assert.rejects(
      async () => {
        await env.run(sendEmail, 'fail@example.com', 'Test Subject', 'Test Body');
      },
      (err: any) => {
        assert.ok(err instanceof ApplicationFailure);
        assert.equal(err.message, 'Failed to send email.');
        return true;
      }
    );
  });
});
