import { publishDomainEvent } from '@/lib/ai/control-plane';
import type { DomainModule } from '@/lib/ai/control-plane-types';

export async function publishModuleMutationEvent(args: {
  tenantId: string;
  module: DomainModule;
  entity: string;
  event: string;
  actorId: string;
  payload: Record<string, unknown>;
  correlationId?: string;
}) {
  return publishDomainEvent({
    id: `evt-${args.module}-${args.entity}-${crypto.randomUUID()}`,
    tenantId: args.tenantId,
    module: args.module,
    entity: args.entity,
    event: args.event,
    occurredAt: new Date().toISOString(),
    actorType: 'user',
    actorId: args.actorId,
    correlationId: args.correlationId || `corr-${args.module}-${args.entity}-${crypto.randomUUID()}`,
    payload: args.payload,
  });
}
