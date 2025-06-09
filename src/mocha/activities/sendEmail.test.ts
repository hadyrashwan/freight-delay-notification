import { MockActivityEnvironment } from '@temporalio/testing';
import { describe, it } from 'mocha';
import * as activities from '../../activities';
import assert from 'assert';
import { setupMocks } from './mocks';

describe('sendEmail Activity', () => {
  setupMocks();
  let originalApiKey: string | undefined;
  let originalUpdateEmail: string | undefined;

  beforeEach(() => {
    originalApiKey = process.env.EMAIL_SERVICE_API_KEY;
    originalUpdateEmail = process.env.DELIVERY_UPDATE_EMAIL;
  });

  afterEach(() => {
    process.env.EMAIL_SERVICE_API_KEY = originalApiKey;
    process.env.DELIVERY_UPDATE_EMAIL = originalUpdateEmail;
  });

  it('returns an object with messageId on success', async () => {
    process.env.EMAIL_SERVICE_API_KEY = 'test-key';
    process.env.DELIVERY_UPDATE_EMAIL = 'test@example.com';
    const env = new MockActivityEnvironment();
    const result = (await env.run(activities.sendEmail, 'test@example.com', 'Test Subject', 'Test Body')) as {
      messageId: string;
    };
    assert.equal(typeof result, 'object');
    assert.equal(result.messageId, 'mocked_message_id');
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
  });

  it('throws an error if email environment variables are not set', async () => {
    const env = new MockActivityEnvironment();
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
  });
});
