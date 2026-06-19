import { describe, expect, it } from 'vitest';
import { resolveRouteAccess } from '@/auth/routes';

describe('resolveRouteAccess', () => {
  it('allows public paths without a session', () => {
    expect(resolveRouteAccess('/', false)).toEqual({ type: 'allow' });
    expect(resolveRouteAccess('/api/auth/sign-in', false)).toEqual({
      type: 'allow',
    });
  });

  it('allows protected paths with a session', () => {
    expect(resolveRouteAccess('/dashboard', true)).toEqual({ type: 'allow' });
    expect(resolveRouteAccess('/api/private', true)).toEqual({ type: 'allow' });
  });

  it('redirects unauthenticated page requests to login', () => {
    expect(resolveRouteAccess('/dashboard', false)).toEqual({
      type: 'redirect',
      location: '/login?redirectTo=%2Fdashboard',
    });
    expect(resolveRouteAccess('/dashboard?tab=billing', false)).toEqual({
      type: 'redirect',
      location: '/login?redirectTo=%2Fdashboard%3Ftab%3Dbilling',
    });
  });

  it('returns unauthorized for unauthenticated non-auth API requests', () => {
    expect(resolveRouteAccess('/api/private', false)).toEqual({
      type: 'unauthorized',
    });
  });
});
