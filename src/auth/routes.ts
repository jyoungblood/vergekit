export const AUTH_API_PREFIX = '/api/auth';
export const LOGIN_PATH = '/login';

export type RouteAccessDecision =
  | { type: 'allow' }
  | { type: 'redirect'; location: string }
  | { type: 'unauthorized' };

const publicExactPaths = new Set([
  '/',
  LOGIN_PATH,
  '/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/favicon.svg',
  '/robots.txt',
]);

const publicPrefixes = ['/_astro/', '/assets/'];

function getRoutePathname(routePath: string) {
  return new URL(routePath, 'https://vk.local').pathname;
}

export function isAuthApiRoute(routePath: string) {
  const pathname = getRoutePathname(routePath);

  return (
    pathname === AUTH_API_PREFIX || pathname.startsWith(`${AUTH_API_PREFIX}/`)
  );
}

export function isPublicRoute(routePath: string) {
  const pathname = getRoutePathname(routePath);

  if (isAuthApiRoute(pathname) || publicExactPaths.has(pathname)) {
    return true;
  }

  return publicPrefixes.some((prefix) => pathname.startsWith(prefix));
}

export function getLoginRedirectPath(destination: string) {
  return `${LOGIN_PATH}?redirectTo=${encodeURIComponent(destination)}`;
}

export function resolveRouteAccess(
  routePath: string,
  isAuthenticated: boolean,
): RouteAccessDecision {
  const pathname = getRoutePathname(routePath);

  if (isPublicRoute(pathname) || isAuthenticated) {
    return { type: 'allow' };
  }

  if (pathname.startsWith('/api/')) {
    return { type: 'unauthorized' };
  }

  return {
    type: 'redirect',
    location: getLoginRedirectPath(routePath),
  };
}
