import { PrismaClient } from '@prisma/client';
const client = new PrismaClient();
async function run() {
  const wfs = await client.studioWorkflow.findMany({ select: { id: true, triggerType: true, triggerConfig: true }});
  console.log(JSON.stringify(wfs, null, 2));
  await client.$disconnect();
}
run();
