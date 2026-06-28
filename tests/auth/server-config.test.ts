import { describe, expect, it } from 'vitest';
import {
  buildAuthOptions,
  createAuth,
  resolveAuthBaseURL,
  resolveAuthSecret,
} from '@/auth/server';
import type { AppDatabase } from '@/db/client';

describe('Better Auth server config', () => {
  const database = {} as AppDatabase;

  it('enables email and password auth with explicit Workers-safe config inputs', () => {
    const options = buildAuthOptions({
      database,
      baseURL: 'https://vk.example.com',
      secret: 'test-secret-with-at-least-32-characters',
    });

    expect(options.baseURL).toBe('https://vk.example.com');
    expect(options.secret).toBe('test-secret-with-at-least-32-characters');
    expect(options.emailAndPassword).toEqual({ enabled: true });
    expect(options.plugins?.map((plugin) => plugin.id)).toContain('admin');
  });

  it('creates a Better Auth handler and session API from the shared database seam', () => {
    const auth = createAuth({
      database,
      baseURL: 'https://vk.example.com',
      secret: 'test-secret-with-at-least-32-characters',
    });

    expect(auth.handler).toBeTypeOf('function');
    expect(auth.api.getSession).toBeTypeOf('function');
  });

  it('resolves auth base URL from an explicit binding or the current request', () => {
    expect(
      resolveAuthBaseURL(
        { BETTER_AUTH_URL: 'https://auth.example.com' },
        new Request('https://vk.example.com/dashboard'),
      ),
    ).toBe('https://auth.example.com');

    expect(
      resolveAuthBaseURL({}, new Request('https://vk.example.com/dashboard')),
    ).toBe('https://vk.example.com');
  });

  it('requires a Better Auth secret binding at runtime', () => {
    expect(resolveAuthSecret({ BETTER_AUTH_SECRET: 'configured-secret' })).toBe(
      'configured-secret',
    );
    expect(() => resolveAuthSecret({})).toThrow(
      'BETTER_AUTH_SECRET is required',
    );
  });
});
