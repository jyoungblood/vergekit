import { describe, expect, it } from 'vitest';
import {
  applyMaskedPasswordCharacter,
  buildCreateAdminUserSql,
  buildWranglerD1ExecuteArgs,
  parseEnvFile,
  resolveBetterAuthUrl,
  resolveD1Target,
  setTerminalEcho,
} from '../../cli/init-admin';

describe('init admin CLI helpers', () => {
  it('parses .dev.vars style environment files', () => {
    expect(
      parseEnvFile(`
# Comment
BETTER_AUTH_URL=http://localhost:4321
APP_NAME="VK Local"
EMAIL_FROM='VK <noreply@example.test>'
EMPTY=
`),
    ).toEqual({
      BETTER_AUTH_URL: 'http://localhost:4321',
      APP_NAME: 'VK Local',
      EMAIL_FROM: 'VK <noreply@example.test>',
      EMPTY: '',
    });
  });

  it('resolves BETTER_AUTH_URL from .dev.vars before process env', () => {
    expect(
      resolveBetterAuthUrl(
        { BETTER_AUTH_URL: 'http://localhost:4321/' },
        { BETTER_AUTH_URL: 'https://example.com' },
      ),
    ).toBe('http://localhost:4321');
  });

  it('infers local D1 from localhost URLs and allows explicit overrides', () => {
    expect(resolveD1Target([], 'http://localhost:4321')).toBe('local');
    expect(resolveD1Target([], 'https://vk.example.com')).toBe('remote');
    expect(resolveD1Target(['--remote'], 'http://localhost:4321')).toBe(
      'remote',
    );
    expect(resolveD1Target(['--local'], 'https://vk.example.com')).toBe(
      'local',
    );
  });

  it('builds verified Better Auth credential insert SQL with escaped values', () => {
    expect(
      buildCreateAdminUserSql({
        userId: 'user-1',
        accountId: 'account-1',
        name: "Ada O'Connor",
        email: 'ADA@EXAMPLE.COM',
        passwordHash: "hash'value",
        now: new Date('2026-06-27T12:00:05.000Z'),
      }),
    ).toBe(
      [
        'INSERT INTO "user" ("id", "name", "email", "emailVerified", "image", "role", "banned", "banReason", "banExpires", "createdAt", "updatedAt") VALUES (\'user-1\', \'Ada O\'\'Connor\', \'ada@example.com\', 1, NULL, \'admin\', 0, NULL, NULL, 1782561605, 1782561605);',
        'INSERT INTO "account" ("id", "accountId", "providerId", "userId", "accessToken", "refreshToken", "idToken", "accessTokenExpiresAt", "refreshTokenExpiresAt", "scope", "password", "createdAt", "updatedAt") VALUES (\'account-1\', \'user-1\', \'credential\', \'user-1\', NULL, NULL, NULL, NULL, NULL, NULL, \'hash\'\'value\', 1782561605, 1782561605);',
      ].join('\n'),
    );
  });

  it('builds local and remote wrangler d1 execute arguments', () => {
    expect(buildWranglerD1ExecuteArgs('vk', 'local', 'select 1')).toEqual([
      'wrangler',
      'd1',
      'execute',
      'vk',
      '--local',
      '--command',
      'select 1',
    ]);
    expect(buildWranglerD1ExecuteArgs('vk', 'remote', 'select 1')).toEqual([
      'wrangler',
      'd1',
      'execute',
      'vk',
      '--remote',
      '--command',
      'select 1',
    ]);
  });

  it('masks password characters and handles backspace without losing value', () => {
    let state = applyMaskedPasswordCharacter('', 's');
    expect(state).toEqual({
      status: 'input',
      value: 's',
      output: '*',
    });

    state = applyMaskedPasswordCharacter(state.value, '3');
    expect(state).toEqual({
      status: 'input',
      value: 's3',
      output: '*',
    });

    state = applyMaskedPasswordCharacter(state.value, '\u007f');
    expect(state).toEqual({
      status: 'input',
      value: 's',
      output: '\b \b',
    });

    state = applyMaskedPasswordCharacter(state.value, '\n');
    expect(state).toEqual({
      status: 'submit',
      value: 's',
      output: '',
    });
  });

  it('uses stty to disable and restore terminal echo', () => {
    const calls: Array<{ command: string; args: string[] }> = [];
    const runner = (command: string, args: string[]) => {
      calls.push({ command, args });
      return { status: 0 };
    };

    expect(setTerminalEcho(false, runner)).toBe(true);
    expect(setTerminalEcho(true, runner)).toBe(true);
    expect(calls).toEqual([
      { command: 'stty', args: ['-echo'] },
      { command: 'stty', args: ['echo'] },
    ]);
  });
});
