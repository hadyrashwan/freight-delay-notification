import { Connection, Client } from '@temporalio/client';
import { delayNotification } from './workflows';
import { nanoid } from 'nanoid';

async function run() {
  const connection = await Connection.connect({ address: process.env.TEMPORAL_ADDRESS });
  const client = new Client({
    connection,
  });

  const handle = await client.workflow.start(delayNotification, {
    taskQueue: 'delivery-delay',
    // Hard coded for development purposes we expect the argument below to be provided.
    args: ['h2rashwan@gmail.com','R. Manuel Pinto de Azevedo 617, 4149-010 Porto','Restaurante Toca do Julio Estrada do Rodizio, R. de Santo André 12, 2705-335 Colares',10,['Avenida Infante Dom Henrique, AAFC, 1900-320 Lisboa'],'2025-06-19T23:00:00.000Z'],
    workflowId: 'workflow-' + nanoid(),
  });
  console.log(`Started workflow ${handle.workflowId}`);

  console.log(await handle.result());
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
