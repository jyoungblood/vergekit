import { describe, expect, it, vi } from 'vitest';
import { buildAuthOptions } from '@/auth/server';
import { createCloudflareEmailProvider } from '@/email/providers/cloudflare';
import { createConsoleEmailProvider } from '@/email/providers/console';
import { createMailgunEmailProvider } from '@/email/providers/mailgun';
import { createResendEmailProvider } from '@/email/providers/resend';
import {
  createAuthEmailSender,
  createMailerFromEnv,
  renderResetPasswordEmail,
  renderVerifyEmail,
  sendEmail,
} from '@/email/send';
import type { Fetcher, SendEmailInput } from '@/email/types';
import type { AppDatabase } from '@/db/client';

const message = {
  to: 'ada@example.com',
  from: { email: 'accounts@example.com', name: 'VK Accounts' },
  subject: 'Welcome',
  html: '<p>Hello</p>',
  text: 'Hello',
  replyTo: 'support@example.com',
} satisfies SendEmailInput;

describe('email providers', () => {
  it('uses the console provider as a non-delivering local provider', async () => {
    const info = vi.fn();
    const provider = createConsoleEmailProvider({ info });

    const result = await provider.send(message);

    expect(info).toHaveBeenCalledWith('[email:console]', message);
    expect(result).toEqual({ provider: 'console', id: 'console' });
  });

  it('passes the common message shape to the Cloudflare Email binding', async () => {
    const send = vi.fn(async () => ({ messageId: 'cf-message-1' }));
    const provider = createCloudflareEmailProvider({ send });

    const result = await provider.send(message);

    expect(send).toHaveBeenCalledWith(message);
    expect(result).toEqual({ provider: 'cloudflare', id: 'cf-message-1' });
  });

  it('sends Resend payloads with bearer auth and reply_to mapping', async () => {
    const fetcher = vi.fn<Fetcher>(async () => {
      return Response.json({ id: 'resend-message-1' });
    });
    const provider = createResendEmailProvider({
      apiKey: 'resend-key',
      fetcher,
    });

    const result = await provider.send(message);
    const [, init] = fetcher.mock.calls[0]!;

    expect(fetcher).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer resend-key',
          'Content-Type': 'application/json',
        },
      }),
    );
    expect(JSON.parse(String(init?.body))).toEqual({
      to: message.to,
      from: 'VK Accounts <accounts@example.com>',
      subject: message.subject,
      html: message.html,
      text: message.text,
      reply_to: message.replyTo,
    });
    expect(result).toEqual({ provider: 'resend', id: 'resend-message-1' });
  });

  it('sends Mailgun form payloads with basic auth and reply-to header field', async () => {
    const fetcher = vi.fn<Fetcher>(async () => {
      return Response.json({ id: '<mailgun-message-1>' });
    });
    const provider = createMailgunEmailProvider({
      apiKey: 'mailgun-key',
      domain: 'mg.example.com',
      fetcher,
    });

    const result = await provider.send(message);
    const [, init] = fetcher.mock.calls[0]!;
    const body = init?.body as URLSearchParams;

    expect(fetcher).toHaveBeenCalledWith(
      'https://api.mailgun.net/v3/mg.example.com/messages',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: `Basic ${btoa('api:mailgun-key')}`,
        },
      }),
    );
    expect(body.get('to')).toBe(message.to);
    expect(body.get('from')).toBe('VK Accounts <accounts@example.com>');
    expect(body.get('subject')).toBe(message.subject);
    expect(body.get('html')).toBe(message.html);
    expect(body.get('text')).toBe(message.text);
    expect(body.get('h:Reply-To')).toBe(message.replyTo);
    expect(result).toEqual({ provider: 'mailgun', id: '<mailgun-message-1>' });
  });
});

describe('sendEmail', () => {
  it('sends through the configured provider from runtime env', async () => {
    const info = vi.fn();

    const result = await sendEmail(
      { EMAIL_PROVIDER: undefined },
      message,
      { console: { info } },
    );

    expect(info).toHaveBeenCalledWith('[email:console]', message);
    expect(result).toEqual({ provider: 'console', id: 'console' });
  });
});

describe('email runtime factory', () => {
  it('defaults to the console provider for local development', async () => {
    const info = vi.fn();
    const provider = createMailerFromEnv(
      { EMAIL_PROVIDER: undefined },
      { console: { info } },
    );

    await provider.send(message);

    expect(info).toHaveBeenCalledWith('[email:console]', message);
  });

  it('requires explicit provider configuration for production email providers', () => {
    expect(() =>
      createMailerFromEnv({ EMAIL_PROVIDER: 'cloudflare' }),
    ).toThrow('EMAIL binding is required');
    expect(() =>
      createMailerFromEnv({ EMAIL_PROVIDER: 'resend' }),
    ).toThrow('RESEND_API_KEY is required');
    expect(() =>
      createMailerFromEnv({ EMAIL_PROVIDER: 'mailgun' }),
    ).toThrow('MAILGUN_API_KEY is required');
    expect(() =>
      createMailerFromEnv({ EMAIL_PROVIDER: 'smtp-node' }),
    ).toThrow('Unsupported EMAIL_PROVIDER "smtp-node"');
  });
});

describe('auth email rendering', () => {
  it('renders verification email html and text with the Backstro template', async () => {
    const email = await renderVerifyEmail({
      appName: 'VK',
      name: 'Ada',
      url: 'https://vk.example.com/verify-email?token=abc',
    });

    expect(email.subject).toBe('Verify your VK email');
    expect(email.html).toContain('Confirm email address');
    expect(email.html).toContain(
      'https://vk.example.com/verify-email?token=abc',
    );
    expect(email.text).toContain('Confirm email address');
    expect(email.text).toContain(
      'https://vk.example.com/verify-email?token=abc',
    );
  });

  it('renders reset password email html and text with the Backstro template', async () => {
    const email = await renderResetPasswordEmail({
      appName: 'VK',
      name: 'Ada',
      url: 'https://vk.example.com/reset-password/token',
    });

    expect(email.subject).toBe('Reset your VK password');
    expect(email.html).toContain('Reset password');
    expect(email.html).toContain('https://vk.example.com/reset-password/token');
    expect(email.text).toContain('Reset password');
    expect(email.text).toContain('https://vk.example.com/reset-password/token');
  });
});

describe('Better Auth email hooks', () => {
  it('wires verification and reset hooks through the auth email sender', async () => {
    const sent: SendEmailInput[] = [];
    const authEmail = createAuthEmailSender({
      appName: 'VK',
      from: 'accounts@example.com',
      mailer: {
        send: async (input) => {
          sent.push(input);
          return { provider: 'console', id: 'test' };
        },
      },
    });
    const options = buildAuthOptions({
      database: {} as AppDatabase,
      baseURL: 'https://vk.example.com',
      secret: 'test-secret-with-at-least-32-characters',
      authEmail,
    });

    await options.emailVerification?.sendVerificationEmail?.({
      user: userFixture,
      token: 'verify-token',
      url: 'https://vk.example.com/verify-email?token=verify-token',
    });
    await options.emailAndPassword?.sendResetPassword?.({
      user: userFixture,
      token: 'reset-token',
      url: 'https://vk.example.com/reset-password/reset-token',
    });

    expect(sent).toHaveLength(2);
    expect(sent[0]).toMatchObject({
      to: 'ada@example.com',
      from: 'accounts@example.com',
      subject: 'Verify your VK email',
    });
    expect(sent[0]?.html).toContain('verify-token');
    expect(sent[1]).toMatchObject({
      to: 'ada@example.com',
      from: 'accounts@example.com',
      subject: 'Reset your VK password',
    });
    expect(sent[1]?.html).toContain('reset-token');
  });
});

const userFixture = {
  id: 'user_1',
  name: 'Ada',
  email: 'ada@example.com',
  emailVerified: false,
  image: null,
  createdAt: new Date('2026-06-19T00:00:00.000Z'),
  updatedAt: new Date('2026-06-19T00:00:00.000Z'),
};
