export const CRON_SYNC_PATH = '/api/integrations/cron/sync';

export function isMiddlewareSessionExemptPath(pathname: string) {
  return (
    pathname === CRON_SYNC_PATH ||
    pathname.startsWith('/api/public') ||
    pathname.startsWith('/api/vehicle-export/requests')
  );
}

export function isMiddlewareAuthorizedPath(
  pathname: string,
  token: unknown
) {
  return isMiddlewareSessionExemptPath(pathname) || Boolean(token);
}
