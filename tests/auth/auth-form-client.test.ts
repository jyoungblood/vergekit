// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  extractAuthErrorMessage,
  handleAuthFormSubmit,
  resolveAuthRedirectTarget,
} from '@/auth/browser';

function createAuthForm(action = '/api/auth/sign-in/email') {
  document.body.innerHTML = `
    <form data-auth-form data-auth-error="auth-error" method="post" action="${action}">
      <input type="hidden" name="callbackURL" value="/dashboard" />
      <input name="email" value="ada@example.com" />
      <input name="password" value="correct horse battery staple" />
      <input type="checkbox" name="rememberMe" value="true" checked />
      <button type="submit">Submit</button>
      <p id="auth-error" hidden></p>
    </form>
  `;

  const form = document.querySelector('form');
  if (!(form instanceof HTMLFormElement)) {
    throw new Error('Expected auth form fixture to render a form');
  }

  return form;
}

describe('auth form browser behavior', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/login');
    vi.restoreAllMocks();
  });

  it('posts the form to Better Auth and redirects to the API success URL', async () => {
    const form = createAuthForm();
    const fetcher = vi.fn<typeof fetch>(async () => {
      return Response.json({
        redirect: true,
        url: '/dashboard',
      });
    });

    const redirectTo = await handleAuthFormSubmit(form, { fetcher });

    expect(fetcher).toHaveBeenCalledWith(
      '/api/auth/sign-in/email',
      expect.objectContaining({
        method: 'POST',
        credentials: 'same-origin',
      }),
    );
    const [, init] = fetcher.mock.calls[0]!;
    expect(init?.headers).toEqual(
      expect.objectContaining({ 'Content-Type': 'application/json' }),
    );
    expect(init?.body).toBe(
      JSON.stringify({
        callbackURL: '/dashboard',
        email: 'ada@example.com',
        password: 'correct horse battery staple',
        rememberMe: true,
      }),
    );
    expect(redirectTo).toBe('/dashboard');
  });

  it('sends unchecked remember-me as a boolean false', async () => {
    const form = createAuthForm();
    const rememberMe = form.elements.namedItem('rememberMe');
    if (!(rememberMe instanceof HTMLInputElement)) {
      throw new Error('Expected remember-me checkbox in fixture');
    }
    rememberMe.checked = false;
    const fetcher = vi.fn<typeof fetch>(async () => {
      return Response.json({
        redirect: true,
        url: '/dashboard',
      });
    });

    await handleAuthFormSubmit(form, { fetcher });

    const [, init] = fetcher.mock.calls[0]!;
    expect(JSON.parse(String(init?.body))).toEqual(
      expect.objectContaining({ rememberMe: false }),
    );
  });

  it('falls back to the callback URL for successful sign-up responses', async () => {
    const form = createAuthForm('/api/auth/sign-up/email');
    const fetcher = vi.fn<typeof fetch>(async () => {
      return Response.json({
        token: 'session-token',
        user: { id: 'user_123' },
      });
    });

    await expect(handleAuthFormSubmit(form, { fetcher })).resolves.toBe(
      '/dashboard',
    );
  });

  it('renders Better Auth errors in the form without redirecting', async () => {
    const form = createAuthForm();
    const fetcher = vi.fn<typeof fetch>(async () => {
      return Response.json(
        {
          code: 'INVALID_EMAIL_OR_PASSWORD',
          message: 'Invalid email or password',
        },
        { status: 401 },
      );
    });

    await expect(handleAuthFormSubmit(form, { fetcher })).resolves.toBeNull();

    const error = document.querySelector('#auth-error');
    expect(error?.textContent).toBe('Invalid email or password');
    expect(error?.hasAttribute('hidden')).toBe(false);
  });

  it('keeps auth redirects on the current origin', () => {
    expect(resolveAuthRedirectTarget('/dashboard')).toBe('/dashboard');
    expect(
      resolveAuthRedirectTarget(`${window.location.origin}/dashboard?tab=home`),
    ).toBe('/dashboard?tab=home');
    expect(resolveAuthRedirectTarget('https://attacker.example')).toBeNull();
    expect(resolveAuthRedirectTarget('https://[')).toBeNull();
  });

  it('extracts useful messages from common Better Auth error payloads', () => {
    expect(extractAuthErrorMessage({ message: 'Password is too short' })).toBe(
      'Password is too short',
    );
    expect(extractAuthErrorMessage({ error: 'Invalid request' })).toBe(
      'Invalid request',
    );
    expect(extractAuthErrorMessage(null)).toBe(
      "We couldn't complete that request. Check the fields and try again.",
    );
  });
});
