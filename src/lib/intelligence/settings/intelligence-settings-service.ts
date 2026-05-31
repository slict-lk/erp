import { PrismaClient } from '@prisma/client';

export type RecommendationStatus =
  | 'DRAFT'
  | 'NEEDS_REVIEW'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'IMPLEMENTED';

export interface IntelligenceSettings {
  readinessThreshold: number;
  hardBlockBelowThreshold: boolean;
  minimumProfileConfidence: number;
  minimumRecommendationConfidence: number;
  freshnessHours: number;
  formulaVersion: string;
  approvalDelegationThresholdLkr: number;
  requireHumanReview: boolean;
  autoRunSnapshots: boolean;
  autoRunConstraintScan: boolean;
  recommendationStatusById: Record<string, RecommendationStatus>;
}

const DEFAULT_INTELLIGENCE_SETTINGS: IntelligenceSettings = {
  readinessThreshold: 80,
  hardBlockBelowThreshold: true,
  minimumProfileConfidence: 60,
  minimumRecommendationConfidence: 65,
  freshnessHours: 24,
  formulaVersion: 'v1.0.0',
  approvalDelegationThresholdLkr: 250000,
  requireHumanReview: true,
  autoRunSnapshots: false,
  autoRunConstraintScan: false,
  recommendationStatusById: {},
};

function clampNumber(value: unknown, fallback: number, min: number, max: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback;
  return Math.max(min, Math.min(max, value));
}

function asBoolean(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

function asStatusMap(value: unknown) {
  if (!value || typeof value !== 'object') return {};
  return Object.entries(value as Record<string, unknown>).reduce<Record<string, RecommendationStatus>>(
    (acc, [key, next]) => {
      if (
        next === 'DRAFT' ||
        next === 'NEEDS_REVIEW' ||
        next === 'ACCEPTED' ||
        next === 'REJECTED' ||
        next === 'IMPLEMENTED'
      ) {
        acc[key] = next;
      }
      return acc;
    },
    {}
  );
}

export function normalizeIntelligenceSettings(input: unknown): IntelligenceSettings {
  const source = input && typeof input === 'object'
    ? (input as Record<string, unknown>)
    : {};

  return {
    readinessThreshold: clampNumber(source.readinessThreshold, DEFAULT_INTELLIGENCE_SETTINGS.readinessThreshold, 50, 100),
    hardBlockBelowThreshold: asBoolean(source.hardBlockBelowThreshold, DEFAULT_INTELLIGENCE_SETTINGS.hardBlockBelowThreshold),
    minimumProfileConfidence: clampNumber(source.minimumProfileConfidence, DEFAULT_INTELLIGENCE_SETTINGS.minimumProfileConfidence, 0, 100),
    minimumRecommendationConfidence: clampNumber(
      source.minimumRecommendationConfidence,
      DEFAULT_INTELLIGENCE_SETTINGS.minimumRecommendationConfidence,
      0,
      100
    ),
    freshnessHours: clampNumber(source.freshnessHours, DEFAULT_INTELLIGENCE_SETTINGS.freshnessHours, 1, 168),
    formulaVersion:
      typeof source.formulaVersion === 'string' && source.formulaVersion.trim().length > 0
        ? source.formulaVersion
        : DEFAULT_INTELLIGENCE_SETTINGS.formulaVersion,
    approvalDelegationThresholdLkr: clampNumber(
      source.approvalDelegationThresholdLkr,
      DEFAULT_INTELLIGENCE_SETTINGS.approvalDelegationThresholdLkr,
      0,
      100000000
    ),
    requireHumanReview: asBoolean(source.requireHumanReview, DEFAULT_INTELLIGENCE_SETTINGS.requireHumanReview),
    autoRunSnapshots: asBoolean(source.autoRunSnapshots, DEFAULT_INTELLIGENCE_SETTINGS.autoRunSnapshots),
    autoRunConstraintScan: asBoolean(source.autoRunConstraintScan, DEFAULT_INTELLIGENCE_SETTINGS.autoRunConstraintScan),
    recommendationStatusById: asStatusMap(source.recommendationStatusById),
  };
}

export async function getIntelligenceSettings(prisma: PrismaClient, tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { settings: true },
  });

  const rootSettings = ((tenant?.settings as Record<string, unknown> | null) ?? {}) as Record<string, unknown>;
  return normalizeIntelligenceSettings(rootSettings.organizationalIntelligence);
}

export async function updateIntelligenceSettings(
  prisma: PrismaClient,
  tenantId: string,
  partial: Partial<IntelligenceSettings>
) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { settings: true },
  });

  const rootSettings = ((tenant?.settings as Record<string, unknown> | null) ?? {}) as Record<string, unknown>;
  const current = normalizeIntelligenceSettings(rootSettings.organizationalIntelligence);
  const next = normalizeIntelligenceSettings({
    ...current,
    ...partial,
    recommendationStatusById: partial.recommendationStatusById ?? current.recommendationStatusById,
  });

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      settings: {
        ...rootSettings,
        organizationalIntelligence: next,
      } as any,
    },
  });

  return next;
}

export async function restoreDefaultIntelligenceSettings(prisma: PrismaClient, tenantId: string) {
  return updateIntelligenceSettings(prisma, tenantId, DEFAULT_INTELLIGENCE_SETTINGS);
}

export { DEFAULT_INTELLIGENCE_SETTINGS };
