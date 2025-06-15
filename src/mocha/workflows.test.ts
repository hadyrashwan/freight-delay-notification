import { TestWorkflowEnvironment } from '@temporalio/testing';
import { before, describe, it } from 'mocha';
import { Worker } from '@temporalio/worker';
import { ApplicationFailure } from '@temporalio/common';
import * as workflows from '../workflows';
import assert from 'assert';

describe('delayNotification workflow', () => {
  let testEnv: TestWorkflowEnvironment;

  before(async () => {
    testEnv = await TestWorkflowEnvironment.createLocal();
  });

  after(async () => {
    await testEnv?.teardown();
  });

  it('successfully completes the full workflow', async () => {
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
      client.workflow.execute(workflows.delayNotification, {
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

describe('handleGetDelay', () => {
  let testEnv: TestWorkflowEnvironment;

  before(async () => {
    testEnv = await TestWorkflowEnvironment.createLocal();
  });

  after(async () => {
    await testEnv?.teardown();
  });

  it('successfully gets delay automatically', async () => {
    const { client, nativeConnection } = testEnv;
    const taskQueue = 'test';

    const worker = await Worker.create({
      connection: nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
      activities: {
        getDelay: async () => ({ trafficDelayInSeconds: 500 }),
      },
    });

    const result = await worker.runUntil(
      client.workflow.execute(workflows.handleGetDelay, {
        args: ['Origin', 'Destination', {}],
        workflowId: 'handle-get-delay-success',
        taskQueue,
      }),
    );

    assert.deepStrictEqual(result, { trafficDelayInSeconds: 500 });
  });

  it('successfully uses manual override for delay', async () => {
    const { client, nativeConnection } = testEnv;
    const taskQueue = 'test';

    const worker = await Worker.create({
      connection: nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
      activities: {
        getDelay: async () => {
          throw ApplicationFailure.create({ nonRetryable: true, message: 'Intentional error' });
        },
      },
    });

    const handle = await client.workflow.start(workflows.handleGetDelay, {
      args: ['Origin', 'Destination', {}],
      workflowId: 'handle-get-delay-manual-override',
      taskQueue,
    });

    await handle.signal(workflows.manualDelayOverrideSignal, 600);
    const result = await worker.runUntil(() => handle.result());
    assert.deepStrictEqual(result, { trafficDelayInSeconds: 600 });
  });
});

describe('handleSendEmail', () => {
  let testEnv: TestWorkflowEnvironment;

  before(async () => {
    testEnv = await TestWorkflowEnvironment.createLocal();
  });

  after(async () => {
    await testEnv?.teardown();
  });

  it('successfully sends an email', async () => {
    const { client, nativeConnection } = testEnv;
    const taskQueue = 'test';

    const worker = await Worker.create({
      connection: nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
      activities: {
        sendEmail: async () => ({ messageId: 'test-message-id' }),
      },
    });

    const result = await worker.runUntil(
      client.workflow.execute(workflows.handleSendEmail, {
        args: ['test@example.com', 'Test message', 'Destination'],
        workflowId: 'handle-send-email-success',
        taskQueue,
      }),
    );

    assert.deepStrictEqual(result, { messageId: 'test-message-id' });
  });

  it('successfully uses manual confirmation for sending email', async () => {
    const { client, nativeConnection } = testEnv;
    const taskQueue = 'test';

    const worker = await Worker.create({
      connection: nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
      activities: {
        sendEmail: async () => {
          throw ApplicationFailure.create({ nonRetryable: true, message: 'Intentional error' });
        },
      },
    });

    const handle = await client.workflow.start(workflows.handleSendEmail, {
      args: ['test@example.com', 'Test message', 'Destination'],
      workflowId: 'handle-send-email-manual-confirmation',
      taskQueue,
    });

    await handle.signal(workflows.manualConfirmationSignal);
    const result = await worker.runUntil(() => handle.result());
    assert.ok(result.messageId?.startsWith('manual-'));
  });
});

describe('handleMessageGeneration', () => {
  let testEnv: TestWorkflowEnvironment;

  before(async () => {
    testEnv = await TestWorkflowEnvironment.createLocal();
  });

  after(async () => {
    await testEnv?.teardown();
  });

  it('successfully returns a message from getMessage', async () => {
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
      client.workflow.execute(workflows.handleMessageGeneration, {
        args: [1000, 'Origin', 'Destination'],
        workflowId: 'test-handleMessageGeneration-success',
        taskQueue,
      }),
    );
    assert.deepEqual(result, { message: 'Hello from getMessage' });
  });

  it('successfully falls back to getDefaultMessage on error', async () => {
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
      client.workflow.execute(workflows.handleMessageGeneration, {
        args: [1000, 'Origin', 'Destination'],
        workflowId: 'test-handleMessageGeneration-fallback',
        taskQueue,
      }),
    );
    assert.deepEqual(result, { message: 'Hello from getDefaultMessage' });
  });
});
