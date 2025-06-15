import { TestWorkflowEnvironment } from '@temporalio/testing';
import { before, describe, it } from 'mocha';
import { Worker } from '@temporalio/worker';
import { ApplicationFailure } from '@temporalio/common';
import { delayNotification, handleMessageGeneration } from '../workflows';
import assert from 'assert';

describe('delayNotification workflow', () => {
  let testEnv: TestWorkflowEnvironment;

  before(async () => {
    testEnv = await TestWorkflowEnvironment.createLocal();
  });

  after(async () => {
    await testEnv?.teardown();
  });

  it('successfully completes the delayNotification Workflow', async function () {
    const { client, nativeConnection } = testEnv;
    const taskQueue = 'test';

    const worker = await Worker.create({
      connection: nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
      activities: {
        getDelay: async () => ({ trafficDelayInSeconds: 500 }),
        sendEmail: async () => ({ messageId: 'test-message-id' }),
        getMessage: async () => ({ message: 'test message' }),
        getDefaultMessage: async () => ({ message: 'default message' }),
        validateEnv: async () => true,
      },
    });

    const result = await worker.runUntil(
      client.workflow.execute(delayNotification, {
        args: ['test@example.com', 'Origin', 'Destination', 300],
        workflowId: 'delay-notification-test',
        taskQueue,
      }),
    );
    assert.deepStrictEqual(result, {
      isDelayed: true,
      messageId: 'test-message-id',
      message: 'test message',
      trafficDelayInSeconds: 500,
    });
  });
});

describe('handleMessageGeneration workflow', () => {
  let testEnv: TestWorkflowEnvironment;

  before(async () => {
    testEnv = await TestWorkflowEnvironment.createLocal();
  });

  after(async () => {
    await testEnv?.teardown();
  });

  it('successfully returns a message from getMessage', async function () {
    const { client, nativeConnection } = testEnv;
    const taskQueue = 'test';

    const worker = await Worker.create({
      connection: nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
      activities: {
        getMessage: async () => ({ message: 'Hello from getMessage' }),
        getDefaultMessage: async () => ({ message: 'Hello from getDefaultMessage' }),
      },
    });

    const result = await worker.runUntil(
      client.workflow.execute(handleMessageGeneration, {
        args: [1000, 'Origin', 'Destination'],
        workflowId: 'test-handleMessageGeneration-success',
        taskQueue,
      }),
    );
    assert.deepEqual(result, { message: 'Hello from getMessage' });
  });

  it('successfully falls back to getDefaultMessage on error', async function () {
    const { client, nativeConnection } = testEnv;
    const taskQueue = 'test';

    const worker = await Worker.create({
      connection: nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
      activities: {
        getMessage: async () => {
          throw ApplicationFailure.create({ nonRetryable: true, message: 'Intentional error' });
        },
        getDefaultMessage: async () => ({ message: 'Hello from getDefaultMessage' }),
      },
    });

    const result = await worker.runUntil(
      client.workflow.execute(handleMessageGeneration, {
        args: [1000, 'Origin', 'Destination'],
        workflowId: 'test-handleMessageGeneration-fallback',
        taskQueue,
      }),
    );
    assert.deepEqual(result, { message: 'Hello from getDefaultMessage' });
  });
});
