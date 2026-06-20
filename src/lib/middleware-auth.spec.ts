import {
  CRON_SYNC_PATH,
  isMiddlewareAuthorizedPath,
  isMiddlewareSessionExemptPath,
} from '@/lib/middleware-auth';

describe('middleware auth path rules', () => {
  it('allows only the exact cron sync path through without a session token', () => {
    expect(isMiddlewareSessionExemptPath(CRON_SYNC_PATH)).toBe(true);
    expect(isMiddlewareAuthorizedPath(CRON_SYNC_PATH, null)).toBe(true);
  });

  it('does not exempt similar integrations paths', () => {
    expect(isMiddlewareSessionExemptPath('/api/integrations/sync')).toBe(false);
    expect(isMiddlewareAuthorizedPath('/api/integrations/sync', null)).toBe(false);
    expect(isMiddlewareAuthorizedPath('/api/integrations/sync', { sub: 'user-1' })).toBe(true);
  });

  it('does not exempt arbitrary cron-like paths', () => {
    expect(isMiddlewareSessionExemptPath('/api/cron/intelligence')).toBe(false);
    expect(isMiddlewareSessionExemptPath('/api/integrations/cron/sync/extra')).toBe(false);
    expect(isMiddlewareAuthorizedPath('/api/cron/intelligence', null)).toBe(false);
  });
});
