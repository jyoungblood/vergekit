#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import process from 'node:process';
import { createInterface } from 'node:readline/promises';
import { pathToFileURL } from 'node:url';
import { hashPassword } from 'better-auth/crypto';

export type D1Target = 'local' | 'remote';

export interface CreateAdminUserSqlInput {
  userId: string;
  accountId: string;
  name: string;
  email: string;
  passwordHash: string;
  now: Date;
}

export type MaskedPasswordCharacterResult =
  | { status: 'input'; value: string; output: string }
  | { status: 'submit'; value: string; output: string }
  | { status: 'cancel'; value: string; output: string };

interface AdminPromptInput {
  name: string;
  email: string;
  password: string;
}

type EnvRecord = Record<string, string | undefined>;
type TerminalEchoRunner = (
  command: string,
  args: string[],
  options: { stdio: ['inherit', 'ignore', 'ignore'] },
) => { status?: number | null; error?: Error };

const DEFAULT_AUTH_URL = 'http://localhost:4321';
const DEFAULT_DATABASE_NAME = 'vk';
const DEFAULT_ADMIN_NAME = 'Admin User';

export function parseEnvFile(source: string): Record<string, string> {
  const values: Record<string, string> = {};

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (!key) {
      continue;
    }

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}

function readDevVars(cwd = process.cwd()) {
  const devVarsPath = `${cwd}/.dev.vars`;

  if (!existsSync(devVarsPath)) {
    return {};
  }

  return parseEnvFile(readFileSync(devVarsPath, 'utf8'));
}

export function resolveBetterAuthUrl(
  devVars: EnvRecord,
  env: EnvRecord = process.env,
) {
  const rawUrl =
    devVars.BETTER_AUTH_URL?.trim() ||
    env.BETTER_AUTH_URL?.trim() ||
    DEFAULT_AUTH_URL;
  const url = new URL(rawUrl);

  return url.toString().replace(/\/$/, '');
}

function isLocalUrl(url: string) {
  const hostname = new URL(url).hostname;

  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname === '::1' ||
    hostname === '[::1]'
  );
}

function parseTargetOverride(args: string[]): D1Target | null {
  const hasLocal = args.includes('--local');
  const hasRemote = args.includes('--remote');

  if (hasLocal && hasRemote) {
    throw new Error('Use either --local or --remote, not both.');
  }

  if (hasLocal) {
    return 'local';
  }

  if (hasRemote) {
    return 'remote';
  }

  return null;
}

export function resolveD1Target(args: string[], betterAuthUrl: string): D1Target {
  return parseTargetOverride(args) ?? (isLocalUrl(betterAuthUrl) ? 'local' : 'remote');
}

function sqlString(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

function sqlNullableString(value: string | null) {
  return value === null ? 'NULL' : sqlString(value);
}

export function buildCreateAdminUserSql({
  userId,
  accountId,
  name,
  email,
  passwordHash,
  now,
}: CreateAdminUserSqlInput) {
  const timestamp = Math.floor(now.getTime() / 1000);
  const normalizedEmail = email.trim().toLowerCase();

  return [
    `INSERT INTO "user" ("id", "name", "email", "emailVerified", "image", "role", "banned", "banReason", "banExpires", "createdAt", "updatedAt") VALUES (${sqlString(userId)}, ${sqlString(name)}, ${sqlString(normalizedEmail)}, 1, ${sqlNullableString(null)}, 'admin', 0, NULL, NULL, ${timestamp}, ${timestamp});`,
    `INSERT INTO "account" ("id", "accountId", "providerId", "userId", "accessToken", "refreshToken", "idToken", "accessTokenExpiresAt", "refreshTokenExpiresAt", "scope", "password", "createdAt", "updatedAt") VALUES (${sqlString(accountId)}, ${sqlString(userId)}, 'credential', ${sqlString(userId)}, NULL, NULL, NULL, NULL, NULL, NULL, ${sqlString(passwordHash)}, ${timestamp}, ${timestamp});`,
  ].join('\n');
}

export function buildWranglerD1ExecuteArgs(
  databaseName: string,
  target: D1Target,
  sql: string,
) {
  return [
    'wrangler',
    'd1',
    'execute',
    databaseName,
    target === 'local' ? '--local' : '--remote',
    '--command',
    sql,
  ];
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function applyMaskedPasswordCharacter(
  value: string,
  character: string,
): MaskedPasswordCharacterResult {
  if (character === '\u0003') {
    return { status: 'cancel', value, output: '' };
  }

  if (character === '\r' || character === '\n') {
    return { status: 'submit', value, output: '' };
  }

  if (character === '\u007f' || character === '\b') {
    if (!value) {
      return { status: 'input', value, output: '' };
    }

    return { status: 'input', value: value.slice(0, -1), output: '\b \b' };
  }

  return { status: 'input', value: `${value}${character}`, output: '*' };
}

export function setTerminalEcho(
  enabled: boolean,
  runner: TerminalEchoRunner = spawnSync,
) {
  const result = runner('stty', [enabled ? 'echo' : '-echo'], {
    stdio: ['inherit', 'ignore', 'ignore'],
  });

  return !result.error && result.status === 0;
}

function showHelp() {
  console.log(`Create a verified Better Auth user with the admin role in D1.

Usage:
  npm run init:admin
  npm run init:admin -- --local
  npm run init:admin -- --remote

By default, the script reads BETTER_AUTH_URL from .dev.vars or the shell.
Localhost URLs target local D1; other URLs target remote D1.`);
}

async function questionHidden(query: string) {
  const input = process.stdin;

  if (!input.isTTY || typeof input.setRawMode !== 'function') {
    const fallback = createInterface({ input, output: process.stdout });

    try {
      return await fallback.question(query);
    } finally {
      fallback.close();
    }
  }

  return new Promise<string>((resolve, reject) => {
    let value = '';
    const wasRaw = input.isRaw;
    const didDisableEcho = setTerminalEcho(false);

    const cleanup = () => {
      input.off('data', onData);
      input.setRawMode(Boolean(wasRaw));
      if (didDisableEcho) {
        setTerminalEcho(true);
      }
      input.pause();
      process.stdout.write('\n');
    };

    const onData = (data: Buffer) => {
      for (const character of data.toString('utf8')) {
        const next = applyMaskedPasswordCharacter(value, character);

        if (next.output) {
          process.stdout.write(next.output);
        }

        value = next.value;

        if (next.status === 'cancel') {
          cleanup();
          reject(new Error('Cancelled.'));
          return;
        }

        if (next.status === 'submit') {
          cleanup();
          resolve(value);
          return;
        }
      }
    };

    process.stdout.write(query);
    input.setRawMode(true);
    input.resume();
    input.on('data', onData);
  });
}

async function promptForAdminUser(): Promise<AdminPromptInput> {
  const readline = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  let readlineClosed = false;
  const closeReadline = () => {
    if (!readlineClosed) {
      readline.close();
      readlineClosed = true;
    }
  };

  try {
    const rawName = await readline.question(
      `Enter admin name (press Enter for "${DEFAULT_ADMIN_NAME}"): `,
    );
    const name = rawName.trim() || DEFAULT_ADMIN_NAME;

    let email = '';

    while (!email) {
      const rawEmail = await readline.question('Enter admin email: ');
      const candidate = rawEmail.trim().toLowerCase();

      if (isValidEmail(candidate)) {
        email = candidate;
        break;
      }

      console.error('Invalid email format. Please try again.');
    }

    closeReadline();

    let password = '';

    while (!password) {
      const candidate = await questionHidden(
        'Enter admin password (minimum 8 characters): ',
      );

      if (candidate.length >= 8) {
        password = candidate;
        break;
      }

      console.error('Password must be at least 8 characters long.');
    }

    return { name, email, password };
  } finally {
    closeReadline();
  }
}

function runCommand(command: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: false,
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
    });
  });
}

async function createAdminUser(input: AdminPromptInput, target: D1Target) {
  const passwordHash = await hashPassword(input.password);
  const sql = buildCreateAdminUserSql({
    userId: randomUUID(),
    accountId: randomUUID(),
    name: input.name,
    email: input.email,
    passwordHash,
    now: new Date(),
  });

  await runCommand(
    'npx',
    buildWranglerD1ExecuteArgs(DEFAULT_DATABASE_NAME, target, sql),
  );
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }

  const betterAuthUrl = resolveBetterAuthUrl(readDevVars());
  const target = resolveD1Target(args, betterAuthUrl);
  const admin = await promptForAdminUser();

  console.log(
    `\nCreating verified user with the admin role in ${target} D1 database "${DEFAULT_DATABASE_NAME}"...`,
  );

  await createAdminUser(admin, target);

  console.log(`\nAdmin role user created: ${admin.email}`);
}

function isMain(moduleUrl: string, argvPath: string | undefined) {
  return Boolean(argvPath && moduleUrl === pathToFileURL(argvPath).href);
}

if (isMain(import.meta.url, process.argv[1])) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`\nFailed to create admin user: ${message}`);
    process.exit(1);
  });
}
