import { describe, expect, it } from 'vitest';
import {
  AUTH_API_PREFIX,
  LOGIN_PATH,
  SIGN_OUT_PATH,
  createSignOutAuthRequest,
  getLoginRedirectPath,
  isAuthApiRoute,
  isPublicRoute,
  resolveSignOutRedirectPath,
  shouldRedirectSignOutRequest,
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

  it('redirects native sign-out form posts while preserving JSON API behavior', () => {
    expect(SIGN_OUT_PATH).toBe('/api/auth/sign-out');
    expect(
      shouldRedirectSignOutRequest(
        new Request('https://vk.local/api/auth/sign-out', {
          method: 'POST',
          headers: { accept: 'text/html' },
        }),
      ),
    ).toBe(true);
    expect(
      shouldRedirectSignOutRequest(
        new Request('https://vk.local/api/auth/sign-out', {
          method: 'POST',
          headers: { accept: 'application/json' },
        }),
      ),
    ).toBe(false);
  });

  it('strips form content before forwarding native sign-out posts to Better Auth', () => {
    const request = new Request('https://vk.local/api/auth/sign-out', {
      method: 'POST',
      headers: {
        accept: 'text/html',
        'content-type': 'application/x-www-form-urlencoded',
        origin: 'https://vk.local',
      },
      body: new URLSearchParams({ redirectTo: '/' }),
    });

    const authRequest = createSignOutAuthRequest(request);

    expect(authRequest.method).toBe('POST');
    expect(authRequest.url).toBe('https://vk.local/api/auth/sign-out');
    expect(authRequest.headers.get('origin')).toBe('https://vk.local');
    expect(authRequest.headers.get('content-type')).toBeNull();
  });

  it('resolves safe sign-out redirects with / as the default', async () => {
    await expect(
      resolveSignOutRedirectPath(
        new Request('https://vk.local/api/auth/sign-out', {
          method: 'POST',
          headers: {
            accept: 'text/html',
            'content-type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ redirectTo: '/dashboard?tab=home' }),
        }),
      ),
    ).resolves.toBe('/dashboard?tab=home');

    await expect(
      resolveSignOutRedirectPath(
        new Request('https://vk.local/api/auth/sign-out', {
          method: 'POST',
          headers: {
            accept: 'text/html',
            'content-type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ redirectTo: 'https://evil.example' }),
        }),
      ),
    ).resolves.toBe('/');

    await expect(
      resolveSignOutRedirectPath(
        new Request('https://vk.local/api/auth/sign-out', {
          method: 'POST',
          headers: { accept: 'text/html' },
        }),
      ),
    ).resolves.toBe('/');
  });
});
