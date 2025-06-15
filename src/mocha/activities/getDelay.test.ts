import { MockActivityEnvironment } from '@temporalio/testing';
import { describe, it } from 'mocha';
import { createGetDelay } from '../../activities/getDelay';
import { GoogleMapsClient } from '../../activities/googleMapsClient';
import assert from 'assert';
import { ApplicationFailure } from '@temporalio/activity';

describe('getDelay Activity', () => {
  it('returns an object with trafficDelayInSeconds on success', async () => {
    const env = new MockActivityEnvironment();
    const mockGoogleMapsClient: GoogleMapsClient = {
      getTrafficDelay: async () => 300,
    };
    const getDelay = createGetDelay(mockGoogleMapsClient);
    const result = await env.run(getDelay, 'origin', 'destination');
    assert.deepStrictEqual(result, { trafficDelayInSeconds: 300 });
  });

  it('throws an error on fetch failure', async () => {
    const env = new MockActivityEnvironment();
    const mockGoogleMapsClient: GoogleMapsClient = {
      getTrafficDelay: async () => {
        throw new ApplicationFailure('Request to traffic api failed');
      },
    };
    const getDelay = createGetDelay(mockGoogleMapsClient);
    await assert.rejects(
      async () => {
        await env.run(getDelay, 'origin', 'fail');
      },
      (err: any) => {
        assert.ok(err instanceof ApplicationFailure);
        assert.equal(err.message, 'Request to traffic api failed');
        return true;
      }
    );
  });

  it('returns an object with trafficDelayInSeconds on success with options', async () => {
    const env = new MockActivityEnvironment();
    const mockGoogleMapsClient: GoogleMapsClient = {
      getTrafficDelay: async () => 300,
    };
    const getDelay = createGetDelay(mockGoogleMapsClient);
    const result = await env.run(getDelay, 'origin', 'destination', {
      waypoints: ['waypoint'],
      departureTimeISO: '2023-01-01T00:00:00Z',
    });
    assert.deepStrictEqual(result, { trafficDelayInSeconds: 300 });
  });
});
