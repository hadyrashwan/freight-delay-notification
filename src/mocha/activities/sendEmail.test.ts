import { MockActivityEnvironment } from '@temporalio/testing';
import { describe, it } from 'mocha';
import * as activities from '../../activities';
import assert from 'assert';
import { setupMocks } from './mocks';

describe('sendEmail Activity', () => {
  setupMocks();

  it('returns an object with messageId on success', async () => {
    process.env.EMAIL_SERVICE_API_KEY = 'test-key';
    process.env.DELIVERY_UPDATE_EMAIL = 'test@example.com';
    const env = new MockActivityEnvironment();
    const result = (await env.run(activities.sendEmail, 'test@example.com', 'Test Subject', 'Test Body')) as { messageId: string };
    assert.equal(typeof result, 'object');
    assert.equal(result.messageId, 'mocked_message_id');
    delete process.env.EMAIL_SERVICE_API_KEY;
    delete process.env.DELIVERY_UPDATE_EMAIL;
  });

  it('throws an error on fetch failure', async () => {
    process.env.EMAIL_SERVICE_API_KEY = 'test-key';
    process.env.DELIVERY_UPDATE_EMAIL = 'test@example.com';
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
    delete process.env.EMAIL_SERVICE_API_KEY;
    delete process.env.DELIVERY_UPDATE_EMAIL;
  });

  it('throws an error if email environment variables are not set', async () => {
    const env = new MockActivityEnvironment();
    const originalApiUrl = process.env.EMAIL_SERVICE_API_KEY;
    const originalUpdateEmail = process.env.DELIVERY_UPDATE_EMAIL;

    delete process.env.EMAIL_SERVICE_API_KEY;
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

    process.env.EMAIL_SERVICE_API_KEY = originalApiUrl;
    process.env.DELIVERY_UPDATE_EMAIL = originalUpdateEmail;
  });
});
