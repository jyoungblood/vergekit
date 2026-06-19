import { describe, expect, it } from 'vitest';
import {
  AUTH_API_PREFIX,
  LOGIN_PATH,
  getLoginRedirectPath,
  isAuthApiRoute,
  isPublicRoute,
} from '@/auth/routes';

describe('auth public route policy', () => {
  it('keeps the Better Auth API route surface public', () => {
    expect(AUTH_API_PREFIX).toBe('/api/auth');
    expect(isAuthApiRoute('/api/auth')).toBe(true);
    expect(isAuthApiRoute('/api/auth/sign-in')).toBe(true);
    expect(isAuthApiRoute('/api/auth/session')).toBe(true);
    expect(isAuthApiRoute('/api/auth/callback/google?code=abc')).toBe(true);
  });

  it('keeps app bootstrap and future auth form paths public', () => {
    expect(isPublicRoute('/')).toBe(true);
    expect(isPublicRoute('/_astro/client.js')).toBe(true);
    expect(isPublicRoute('/favicon.svg')).toBe(true);
    expect(isPublicRoute('/login')).toBe(true);
    expect(isPublicRoute('/register')).toBe(true);
    expect(isPublicRoute('/auth/forgot-password')).toBe(true);
    expect(isPublicRoute('/login?redirectTo=%2Fdashboard')).toBe(true);
  });

  it('treats application pages and non-auth APIs as protected by default', () => {
    expect(isPublicRoute('/dashboard')).toBe(false);
    expect(isPublicRoute('/settings/profile')).toBe(false);
    expect(isPublicRoute('/api/private')).toBe(false);
  });

  it('builds a login redirect with the original destination preserved', () => {
    expect(LOGIN_PATH).toBe('/login');
    expect(getLoginRedirectPath('/dashboard?tab=billing')).toBe(
      '/login?redirectTo=%2Fdashboard%3Ftab%3Dbilling',
    );
  });
});
