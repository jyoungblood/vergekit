import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const projectRoot = new URL('../../', import.meta.url);

function readProjectFile(path: string) {
  return readFileSync(new URL(path, projectRoot), 'utf8');
}

describe('minimal auth UI contract', () => {
  const requiredFiles = [
    'src/components/ui/Button.astro',
    'src/components/ui/Input.astro',
    'src/components/ui/Field.astro',
    'src/components/auth/AuthShell.astro',
    'src/pages/login.astro',
    'src/pages/register.astro',
    'src/pages/auth/forgot-password.astro',
    'src/pages/auth/reset-password.astro',
    'src/pages/auth/verify-email.astro',
    'src/pages/dashboard.astro',
  ];

  it.each(requiredFiles)('creates %s', (path) => {
    expect(existsSync(new URL(path, projectRoot))).toBe(true);
  });

  it('wires auth forms to the mounted Better Auth endpoints', () => {
    const formContracts = [
      {
        file: 'src/pages/login.astro',
        action: '/api/auth/sign-in/email',
        fieldNames: ['email', 'password', 'callbackURL'],
      },
      {
        file: 'src/pages/register.astro',
        action: '/api/auth/sign-up/email',
        fieldNames: ['name', 'email', 'password', 'callbackURL'],
      },
      {
        file: 'src/pages/auth/forgot-password.astro',
        action: '/api/auth/request-password-reset',
        fieldNames: ['email', 'redirectTo'],
      },
      {
        file: 'src/pages/auth/reset-password.astro',
        action: '/api/auth/reset-password',
        fieldNames: ['newPassword', 'token'],
      },
      {
        file: 'src/pages/auth/verify-email.astro',
        action: '/api/auth/send-verification-email',
        fieldNames: ['email', 'callbackURL'],
      },
    ];

    for (const contract of formContracts) {
      const source = readProjectFile(contract.file);

      expect(source).toContain(`action="${contract.action}"`);
      expect(source).toContain('method="post"');

      for (const fieldName of contract.fieldNames) {
        expect(source).toContain(`name="${fieldName}"`);
      }
    }
  });

  it('links the app bootstrap page to the login and registration screens', () => {
    const source = readProjectFile('src/pages/index.astro');

    expect(source).toContain('href="/login"');
    expect(source).toContain('href="/register"');
  });

  it('gates the dashboard link on the authenticated homepage state', () => {
    const source = readProjectFile('src/pages/index.astro');

    expect(source).toContain('Astro.locals.isAuthenticated');
    expect(source).toContain('href="/dashboard"');
  });

  it('marks email auth forms for client-side redirect and inline errors', () => {
    const formContracts = [
      {
        file: 'src/pages/login.astro',
        id: 'login-error',
      },
      {
        file: 'src/pages/register.astro',
        id: 'register-error',
      },
    ];

    for (const contract of formContracts) {
      const source = readProjectFile(contract.file);

      expect(source).toContain('data-auth-form');
      expect(source).toContain(`data-auth-error="${contract.id}"`);
      expect(source).toContain(`id="${contract.id}"`);
      expect(source).toContain('aria-live="polite"');
      expect(source).toContain(
        "import { mountAuthForms } from '@/auth/browser'",
      );
    }
  });

  it('renders the dashboard from auth locals with a server-first sign out form', () => {
    const source = readProjectFile('src/pages/dashboard.astro');

    expect(source).toContain('Astro.locals.user');
    expect(source).toContain('Astro.locals.session');
    expect(source).toContain('action="/api/auth/sign-out"');
    expect(source).toContain('method="post"');
    expect(source).toContain('name="redirectTo"');
    expect(source).toContain('value="/"');
  });
});
