import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { betterAuth, type BetterAuthOptions } from 'better-auth';
import { admin as adminPlugin } from 'better-auth/plugins';
import {
  ADMIN_APP_ROLES,
  DEFAULT_APP_ROLE,
  accessControl,
  authRoles,
} from '@/auth/permissions';
import { createD1Database, type AppDatabase } from '@/db/client';
import * as schema from '@/db/schema';
import {
  createAuthEmailSenderFromEnv,
  type AuthEmailSender,
  type EmailRuntimeEnv,
} from '@/email/send';

export interface CreateAuthOptions {
  database: AppDatabase;
  baseURL: string;
  secret: string;
  authEmail?: AuthEmailSender;
}

export interface AuthRuntimeEnv extends EmailRuntimeEnv {
  DB: D1Database;
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
}

export function buildAuthOptions({
  database,
  baseURL,
  secret,
  authEmail,
}: CreateAuthOptions): BetterAuthOptions {
  const emailAndPassword: BetterAuthOptions['emailAndPassword'] = {
    enabled: true,
  };

  if (authEmail) {
    emailAndPassword.sendResetPassword = async ({ user, url }) => {
      await authEmail.sendResetPasswordEmail({
        to: user.email,
        name: user.name,
        url,
      });
    };
  }

  return {
    baseURL,
    secret,
    database: drizzleAdapter(database, {
      provider: 'sqlite',
      schema,
    }),
    emailAndPassword,
    emailVerification: authEmail
      ? {
          sendOnSignUp: true,
          sendVerificationEmail: async ({ user, url }) => {
            await authEmail.sendVerificationEmail({
              to: user.email,
              name: user.name,
              url,
            });
          },
        }
      : undefined,
    plugins: [
      adminPlugin({
        defaultRole: DEFAULT_APP_ROLE,
        adminRoles: [...ADMIN_APP_ROLES],
        ac: accessControl,
        roles: authRoles,
      }),
    ],
  };
}

export function createAuth(options: CreateAuthOptions) {
  return betterAuth(buildAuthOptions(options));
}

export function resolveAuthBaseURL(
  runtimeEnv: Pick<AuthRuntimeEnv, 'BETTER_AUTH_URL'>,
  request: Request,
) {
  const configuredBaseURL = runtimeEnv.BETTER_AUTH_URL?.trim();

  if (configuredBaseURL) {
    return configuredBaseURL.replace(/\/$/, '');
  }

  return new URL(request.url).origin;
}

export function resolveAuthSecret(
  runtimeEnv: Pick<AuthRuntimeEnv, 'BETTER_AUTH_SECRET'>,
) {
  const secret = runtimeEnv.BETTER_AUTH_SECRET?.trim();

  if (!secret) {
    throw new Error('BETTER_AUTH_SECRET is required to initialize Better Auth');
  }

  return secret;
}

export function createAuthFromEnv(
  runtimeEnv: AuthRuntimeEnv,
  request: Request,
) {
  return createAuth({
    database: createD1Database(runtimeEnv.DB),
    baseURL: resolveAuthBaseURL(runtimeEnv, request),
    secret: resolveAuthSecret(runtimeEnv),
    authEmail: createAuthEmailSenderFromEnv(runtimeEnv),
  });
}
