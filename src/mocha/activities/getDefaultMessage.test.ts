import { MockActivityEnvironment } from '@temporalio/testing';
import { describe, it } from 'mocha';
import * as activities from '../../activities';
import assert from 'assert';

describe('getDefaultMessage Activity', () => {
  it('returns an object with message', async () => {
    const env = new MockActivityEnvironment();
    const result = (await env.run(activities.getDefaultMessage, 100, 'origin', 'destination')) as { message: string };
    assert.equal(typeof result, 'object');
    assert.equal(typeof result.message, 'string');
  });
});
