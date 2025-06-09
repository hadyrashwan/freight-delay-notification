import { MockActivityEnvironment } from '@temporalio/testing';
import { describe, it } from 'mocha';
import * as activities from '../../activities';
import assert from 'assert';
import { setupMocks } from './mocks';

describe('getDelay Activity', () => {
  setupMocks();
  let originalApiKey: string | undefined;

  beforeEach(() => {
    originalApiKey = process.env.TRAFFIC_API_KEY;
    process.env.TRAFFIC_API_KEY = 'test-key';
  });

  afterEach(() => {
    process.env.TRAFFIC_API_KEY = originalApiKey;
  });

  it('returns an object with trafficDelayInSeconds on success', async () => {
    const env = new MockActivityEnvironment();
    const result = (await env.run(activities.getDelay, 'origin', 'destination')) as { trafficDelayInSeconds: number };
    assert.equal(typeof result, 'object');
    assert.equal(result.trafficDelayInSeconds, 300);
  });

  it('throws an error on fetch failure', async () => {
    const env = new MockActivityEnvironment();
    await assert.rejects(
      async () => {
        await env.run(activities.getDelay, 'origin', 'fail');
      },
      (err: any) => {
        assert.ok(err instanceof Error);
        assert.equal(err.message, 'Request to traffic api failed');
        return true;
      }
    );
  });

  it('throws an error if TRAFFIC_API_KEY is not set', async () => {
    const env = new MockActivityEnvironment();
    delete process.env.TRAFFIC_API_KEY;

    await assert.rejects(
      async () => {
        await env.run(activities.getDelay, 'origin', 'destination');
      },
      (err: any) => {
        assert.equal(err.message, 'Missing the API Key configuration.');
        return true;
      }
    );
  });

  it('returns an object with trafficDelayInSeconds on success with options', async () => {
    const env = new MockActivityEnvironment();
    const result = (await env.run(activities.getDelay, 'origin', 'destination', {
      waypoints: ['waypoint'],
      departureTimeISO: '2023-01-01T00:00:00Z',
    })) as { trafficDelayInSeconds: number };
    assert.equal(typeof result, 'object');
    assert.equal(result.trafficDelayInSeconds, 300);
  });
});
