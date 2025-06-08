import { MockActivityEnvironment } from '@temporalio/testing';
import { describe, it } from 'mocha';
import * as activities from '../../activities';
import assert from 'assert';
import { setupMocks } from './mocks';

describe('sendEmail Activity', () => {
  setupMocks();

  it('returns an object with messageId on success', async () => {
    const env = new MockActivityEnvironment();
    const result = (await env.run(activities.sendEmail, 'test@example.com', 'Test Subject', 'Test Body')) as { messageId: string };
    assert.equal(typeof result, 'object');
    assert.equal(result.messageId, 'mocked_message_id');
  });

  it('throws an error on fetch failure', async () => {
    const env = new MockActivityEnvironment();
    await assert.rejects(
      async () => {
        await env.run(activities.sendEmail, 'fail@example.com', 'Test Subject', 'Test Body');
      },
      (err: any) => {
        assert.ok(err instanceof Error);
        assert.ok(err.message.includes('Failed to send email.'));
        return true;
      }
    );
  });

  it('throws an error if email environment variables are not set', async () => {
    const env = new MockActivityEnvironment();
    const originalApiUrl = process.env.EMAIL_SERVICE_API_URL;
    const originalUpdateEmail = process.env.DELIVERY_UPDATE_EMAIL;

    delete process.env.EMAIL_SERVICE_API_URL;
    delete process.env.DELIVERY_UPDATE_EMAIL;

    await assert.rejects(
      async () => {
        await env.run(activities.sendEmail, 'test@example.com', 'Test Subject', 'Test Body');
      },
      (err: any) => {
        assert.ok(err.message.includes('Missing environment variable.'));
        return true;
      }
    );

    process.env.EMAIL_SERVICE_API_URL = originalApiUrl;
    process.env.DELIVERY_UPDATE_EMAIL = originalUpdateEmail;
  });
});
