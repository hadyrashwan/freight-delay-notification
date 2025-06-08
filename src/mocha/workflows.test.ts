import { TestWorkflowEnvironment } from '@temporalio/testing';
import { before, describe, it } from 'mocha';
import { Worker } from '@temporalio/worker';
import * as activities from '../activities';
import { delayNotification } from '../workflows';
import assert from 'assert';

describe('delayNotification workflow', () => {
  let testEnv: TestWorkflowEnvironment;

  before(async () => {
    testEnv = await TestWorkflowEnvironment.createLocal();
  });

  after(async () => {
    await testEnv?.teardown();
  });

  it('successfully completes the delayNotification Workflow', async () => {
    const { client, nativeConnection } = testEnv;
    const taskQueue = 'test';

    const worker = await Worker.create({
      connection: nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
      activities,
    });

    const result = await worker.runUntil(
      client.workflow.execute(delayNotification, {
        args: ['test@example.com', 'Origin', 'Destination', 300],
        workflowId: 'delay-notification-test',
        taskQueue,
      }),
    );
    assert.equal(typeof result, 'object');
    assert.equal(result.isDelayed, true);
    assert.equal(typeof result.messageId, 'string');
    assert.equal(typeof result.message, 'string');
    assert.equal(typeof result.trafficDelayInSeconds, 'number');
  });
});
