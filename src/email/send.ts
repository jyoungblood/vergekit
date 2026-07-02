import { render, renderText } from '@backstro/email/render';
import { appConfig } from '@/config/app';
import { createCloudflareEmailProvider } from './providers/cloudflare';
import { createConsoleEmailProvider } from './providers/console';
import { createMailgunEmailProvider } from './providers/mailgun';
import { createResendEmailProvider } from './providers/resend';
import ResetPasswordEmail from './templates/auth/ResetPassword.astro';
import VerifyEmail from './templates/auth/VerifyEmail.astro';
import { EMAIL_PROVIDER_NAMES } from './types';
import type {
  EmailProvider,
  EmailProviderName,
  Fetcher,
  SendEmailInput,
  SendEmailResult,
} from './types';

export interface EmailRuntimeEnv {
  EMAIL_PROVIDER?: string;
  EMAIL?: SendEmail;
  EMAIL_FROM?: string;
  EMAIL_REPLY_TO?: string;
  RESEND_API_KEY?: string;
  MAILGUN_API_KEY?: string;
  MAILGUN_DOMAIN?: string;
}

const DEFAULT_EMAIL_PROVIDER: EmailProviderName = 'console';
const CONSOLE_FALLBACK_FROM_EMAIL = 'noreply@example.test';

export interface CreateMailerFromEnvOptions {
  console?: Parameters<typeof createConsoleEmailProvider>[0];
  fetcher?: Fetcher;
}

export interface RenderAuthEmailInput {
  appName: string;
  name?: string | null;
  url: string;
}

export interface RenderedAuthEmail {
  subject: string;
  html: string;
  text: string;
}

export interface AuthEmailSender {
  sendVerificationEmail(input: {
    to: string;
    name?: string | null;
    url: string;
  }): Promise<void>;
  sendResetPasswordEmail(input: {
    to: string;
    name?: string | null;
    url: string;
  }): Promise<void>;
}

export interface CreateAuthEmailSenderOptions {
  appName: string;
  from: SendEmailInput['from'];
  mailer: EmailProvider;
  replyTo?: SendEmailInput['replyTo'];
}

export async function sendEmail(
  runtimeEnv: EmailRuntimeEnv,
  input: SendEmailInput,
  options?: CreateMailerFromEnvOptions,
): Promise<SendEmailResult> {
  return createMailerFromEnv(runtimeEnv, options).send(input);
}

export function createMailerFromEnv(
  runtimeEnv: EmailRuntimeEnv,
  options: CreateMailerFromEnvOptions = {},
): EmailProvider {
  const providerName = resolveEmailProviderName(runtimeEnv.EMAIL_PROVIDER);

  switch (providerName) {
    case 'console':
      return createConsoleEmailProvider(options.console);
    case 'cloudflare':
      if (!runtimeEnv.EMAIL) {
        throw new Error('EMAIL binding is required for Cloudflare email');
      }

      return createCloudflareEmailProvider(runtimeEnv.EMAIL);
    case 'resend':
      if (!runtimeEnv.RESEND_API_KEY?.trim()) {
        throw new Error('RESEND_API_KEY is required for Resend email');
      }

      return createResendEmailProvider({
        apiKey: runtimeEnv.RESEND_API_KEY,
        fetcher: options.fetcher,
      });
    case 'mailgun':
      if (!runtimeEnv.MAILGUN_API_KEY?.trim()) {
        throw new Error('MAILGUN_API_KEY is required for Mailgun email');
      }
      if (!runtimeEnv.MAILGUN_DOMAIN?.trim()) {
        throw new Error('MAILGUN_DOMAIN is required for Mailgun email');
      }

      return createMailgunEmailProvider({
        apiKey: runtimeEnv.MAILGUN_API_KEY,
        domain: runtimeEnv.MAILGUN_DOMAIN,
        fetcher: options.fetcher,
      });
  }
}

export function createAuthEmailSender({
  appName,
  from,
  mailer,
  replyTo,
}: CreateAuthEmailSenderOptions): AuthEmailSender {
  return {
    async sendVerificationEmail(input) {
      const email = await renderVerifyEmail({
        appName,
        name: input.name,
        url: input.url,
      });

      await mailer.send({
        to: input.to,
        from,
        subject: email.subject,
        html: email.html,
        text: email.text,
        replyTo,
      });
    },
    async sendResetPasswordEmail(input) {
      const email = await renderResetPasswordEmail({
        appName,
        name: input.name,
        url: input.url,
      });

      await mailer.send({
        to: input.to,
        from,
        subject: email.subject,
        html: email.html,
        text: email.text,
        replyTo,
      });
    },
  };
}

export function createAuthEmailSenderFromEnv(
  runtimeEnv: EmailRuntimeEnv,
  options?: CreateMailerFromEnvOptions,
) {
  const providerName = resolveEmailProviderName(runtimeEnv.EMAIL_PROVIDER);

  return createAuthEmailSender({
    appName: appConfig.name,
    from: resolveEmailFromAddress(runtimeEnv, providerName),
    replyTo: runtimeEnv.EMAIL_REPLY_TO,
    mailer: createMailerFromEnv(runtimeEnv, options),
  });
}

export async function renderVerifyEmail({
  appName,
  name,
  url,
}: RenderAuthEmailInput): Promise<RenderedAuthEmail> {
  const props = { appName, name, verificationUrl: url };

  return {
    subject: `Verify your ${appName} email`,
    html: await render(VerifyEmail, props),
    text: await renderText(VerifyEmail, props),
  };
}

export async function renderResetPasswordEmail({
  appName,
  name,
  url,
}: RenderAuthEmailInput): Promise<RenderedAuthEmail> {
  const props = { appName, name, resetUrl: url };

  return {
    subject: `Reset your ${appName} password`,
    html: await render(ResetPasswordEmail, props),
    text: await renderText(ResetPasswordEmail, props),
  };
}

function resolveEmailProviderName(providerName?: string): EmailProviderName {
  const normalized = providerName?.trim() || DEFAULT_EMAIL_PROVIDER;

  if (EMAIL_PROVIDER_NAMES.includes(normalized as EmailProviderName)) {
    return normalized as EmailProviderName;
  }

  throw new Error(`Unsupported EMAIL_PROVIDER "${normalized}"`);
}

function resolveEmailFromAddress(
  runtimeEnv: EmailRuntimeEnv,
  providerName: EmailProviderName,
) {
  const configuredFrom = runtimeEnv.EMAIL_FROM?.trim();

  if (configuredFrom) {
    return configuredFrom;
  }

  if (providerName === 'console') {
    return {
      email: CONSOLE_FALLBACK_FROM_EMAIL,
      name: appConfig.name,
    };
  }

  throw new Error('EMAIL_FROM is required for configured email provider');
}
