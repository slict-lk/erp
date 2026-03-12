import type {
  AIControlPlaneSettings,
  TenantAIConfig,
} from '@/lib/ai/control-plane-types';

export function buildDefaultSettings(): AIControlPlaneSettings {
  return {
    retentionDays: 180,
    alertChannels: ['in-app', 'email'],
    defaultPolicyProfileId: '',
    diagnosticsEnabled: true,
    brandingTone: 'functional',
    defaultApproverChain: ['AI_ADMIN', 'APPROVER'],
    maxExecutionAttempts: 3,
    retryBackoffMinutes: 10,
    escalationSlaMinutes: 120,
    queuePollingIntervalSeconds: 60,
  };
}

export function buildDefaultTenantConfig(_tenantId: string): TenantAIConfig {
  return {
    settings: buildDefaultSettings(),
    pendingApprovals: [],
    policyProfiles: [],
    copilots: [],
    integrations: [],
    workflowTemplates: [],
    executionQueue: [],
    deadLetterQueue: [],
    workflowVersions: [],
  };
}

export function mergeTenantAIConfig(
  base: TenantAIConfig,
  overrides?: Partial<TenantAIConfig> | null
): TenantAIConfig {
  if (!overrides) {
    return base;
  }

  return {
    settings: {
      ...base.settings,
      ...(overrides.settings || {}),
    },
    pendingApprovals: overrides.pendingApprovals || base.pendingApprovals,
    policyProfiles: overrides.policyProfiles || base.policyProfiles,
    copilots: overrides.copilots || base.copilots,
    integrations: overrides.integrations || base.integrations,
    workflowTemplates: overrides.workflowTemplates || base.workflowTemplates,
    executionQueue: overrides.executionQueue || base.executionQueue,
    deadLetterQueue: overrides.deadLetterQueue || base.deadLetterQueue,
    workflowVersions: overrides.workflowVersions || base.workflowVersions,
  };
}
