import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function diagnose() {
  try {
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      console.log('No tenant found');
      return;
    }

    console.log('--- DIAGNOSIS FOR TENANT:', tenant.name, '---');

    // 1. Check Workflows
    const workflows = await prisma.studioWorkflow.findMany({
      where: { tenantId: tenant.id },
      select: { id: true, name: true, triggerType: true, triggerConfig: true, isActive: true }
    });
    console.log('\n[Workflows]');
    workflows.forEach(w => {
      console.log(`- ${w.name || w.id} (${w.isActive ? 'ACTIVE' : 'INACTIVE'})`);
      console.log(`  Trigger: ${w.triggerType}`);
      console.log(`  Config: ${JSON.stringify(w.triggerConfig)}`);
    });

    // 2. Check Integration Logs for Event Bus
    const logs = await prisma.integrationLog.findMany({
      where: { 
        tenantId: tenant.id,
        integration: 'ai-event-bus'
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    console.log('\n[Event Bus Logs (last 5)]');
    logs.forEach(l => {
      console.log(`- [${l.createdAt.toISOString()}] ${l.action}: ${l.status}`);
      if (l.status === 'FAILED') console.log(`  Error: ${l.errorMessage}`);
    });

    // 3. Check Pending Approvals in Settings
    const settings = (tenant.settings as any) || {};
    const aiConfig = settings.aiControlPlane || {};
    const pendingApprovals = aiConfig.pendingApprovals || [];
    console.log('\n[Pending Approvals in Settings]');
    console.log(`Count: ${pendingApprovals.length}`);
    pendingApprovals.forEach((a: any) => {
      console.log(`- [${a.status}] ${a.title} (${a.id})`);
      console.log(`  Risk: ${a.riskScore}, Category: ${a.actionCategory}`);
    });

    // 4. Check Execution Queue
    const executionQueue = aiConfig.executionQueue || [];
    console.log('\n[Execution Queue (last 5)]');
    executionQueue.slice(0, 5).forEach((item: any) => {
      console.log(`- [${item.status}] Workflow: ${item.workflowId} (${item.id})`);
      if (item.lastError) console.log(`  Error: ${item.lastError}`);
    });

  } catch (err) {
    console.error('Diagnosis failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

diagnose();
