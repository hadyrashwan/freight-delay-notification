import { describe, it } from 'mocha';
import { GoogleMapsClientImpl } from '../../activities/googleMapsClient';
import assert from 'assert';
import { setupMocks } from './mocks';
import { ApplicationFailure } from '@temporalio/activity';

describe('GoogleMapsClient', () => {
  setupMocks();

  it('returns traffic delay on successful API call', async () => {
    const client = new GoogleMapsClientImpl('test-key');
    const delay = await client.getTrafficDelay('origin', 'destination');
    assert.equal(delay, 300);
  });

  it('throws an error on failed API call', async () => {
    const client = new GoogleMapsClientImpl('test-key');
    await assert.rejects(
      async () => {
        await client.getTrafficDelay('origin', 'fail');
      },
      (err: any) => {
        assert.ok(err instanceof ApplicationFailure);
        assert.equal(err.message, 'Request to traffic api failed');
        assert.equal(err.type, 'API_FAILED');
        return true;
      }
    );
  });

  it('returns traffic delay on successful API call with options', async () => {
    const client = new GoogleMapsClientImpl('test-key');
    const delay = await client.getTrafficDelay('origin', 'destination', {
      waypoints: ['waypoint'],
      departureTimeISO: '2023-01-01T00:00:00Z',
    });
    assert.equal(delay, 300);
  });
});
