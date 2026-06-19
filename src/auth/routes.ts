export const AUTH_API_PREFIX = '/api/auth';
export const LOGIN_PATH = '/login';
export const SIGN_OUT_PATH = `${AUTH_API_PREFIX}/sign-out`;

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

function resolveLocalRedirectPath(target: unknown, fallbackPath = '/') {
  if (typeof target !== 'string' || !target.trim()) {
    return fallbackPath;
  }

  let redirectURL: URL;

  try {
    redirectURL = new URL(target, 'https://vk.local');
  } catch {
    return fallbackPath;
  }

  if (redirectURL.origin !== 'https://vk.local') {
    return fallbackPath;
  }

  return `${redirectURL.pathname}${redirectURL.search}${redirectURL.hash}`;
}

export function isAuthApiRoute(routePath: string) {
  const pathname = getRoutePathname(routePath);

  return (
    pathname === AUTH_API_PREFIX || pathname.startsWith(`${AUTH_API_PREFIX}/`)
  );
}

export function isSignOutApiRoute(routePath: string) {
  return getRoutePathname(routePath) === SIGN_OUT_PATH;
}

export function shouldRedirectSignOutRequest(request: Request) {
  const accept = request.headers.get('accept') ?? '';

  return (
    request.method.toUpperCase() === 'POST' &&
    isSignOutApiRoute(request.url) &&
    accept.includes('text/html') &&
    !accept.includes('application/json')
  );
}

export function createSignOutAuthRequest(request: Request) {
  if (!shouldRedirectSignOutRequest(request)) {
    return request;
  }

  const headers = new Headers(request.headers);
  headers.delete('content-length');
  headers.delete('content-type');

  return new Request(request.url, {
    method: request.method,
    headers,
  });
}

export async function resolveSignOutRedirectPath(request: Request) {
  const requestURL = new URL(request.url);
  const queryRedirect =
    requestURL.searchParams.get('redirectTo') ??
    requestURL.searchParams.get('callbackURL');

  if (queryRedirect) {
    return resolveLocalRedirectPath(queryRedirect);
  }

  const contentType = request.headers.get('content-type') ?? '';

  if (
    contentType.includes('application/x-www-form-urlencoded') ||
    contentType.includes('multipart/form-data')
  ) {
    try {
      const formData = await request.clone().formData();
      return resolveLocalRedirectPath(
        formData.get('redirectTo') ?? formData.get('callbackURL'),
      );
    } catch {
      return '/';
    }
  }

  return '/';
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
