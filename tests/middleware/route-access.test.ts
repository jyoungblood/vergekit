import { describe, expect, it } from 'vitest';
import { resolveRouteAccess } from '@/auth/routes';

describe('resolveRouteAccess', () => {
  it('allows public paths without a session', () => {
    expect(resolveRouteAccess('/', false)).toEqual({ type: 'allow' });
    expect(resolveRouteAccess('/about', false)).toEqual({ type: 'allow' });
    expect(resolveRouteAccess('/api/auth/sign-in', false)).toEqual({
      type: 'allow',
    });
    expect(resolveRouteAccess('/api/health', false)).toEqual({
      type: 'allow',
    });
  });

  it('allows protected paths with a session', () => {
    expect(resolveRouteAccess('/dashboard', true)).toEqual({ type: 'allow' });
  });

  it('blocks banned users from authenticated app routes', () => {
    expect(
      resolveRouteAccess('/dashboard', {
        isAuthenticated: true,
        user: { role: 'banned' },
      }),
    ).toEqual({ type: 'forbidden' });
  });

  it('requires admin app permission for admin routes', () => {
    expect(resolveRouteAccess('/admin', false)).toEqual({
      type: 'redirect',
      location: '/login?redirectTo=%2Fadmin',
    });

    expect(
      resolveRouteAccess('/admin/users', {
        isAuthenticated: true,
        user: { role: 'user' },
      }),
    ).toEqual({ type: 'forbidden' });

    expect(
      resolveRouteAccess('/admin/users', {
        isAuthenticated: true,
        user: { role: 'admin' },
      }),
    ).toEqual({ type: 'allow' });
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

  it('allows API routes without a session', () => {
    expect(resolveRouteAccess('/api/private', false)).toEqual({
      type: 'allow',
    });
  });
});
