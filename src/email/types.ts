export const EMAIL_PROVIDER_NAMES = [
  'console',
  'cloudflare',
  'resend',
  'mailgun',
] as const;

export type EmailProviderName = (typeof EMAIL_PROVIDER_NAMES)[number];

export interface EmailAddress {
  email: string;
  name?: string;
}

export type EmailRecipient = string | EmailAddress;

export interface SendEmailInput {
  to: EmailRecipient | EmailRecipient[];
  from: EmailRecipient;
  subject: string;
  html: string;
  text: string;
  replyTo?: EmailRecipient;
}

export interface SendEmailResult {
  provider: EmailProviderName;
  id?: string;
}

export interface EmailProvider {
  send(input: SendEmailInput): Promise<SendEmailResult>;
}

export type Fetcher = typeof fetch;

export function formatEmailAddress(address: EmailRecipient) {
  if (typeof address === 'string') {
    return address;
  }

  if (!address.name?.trim()) {
    return address.email;
  }

  return `${address.name.trim()} <${address.email}>`;
}

export function formatEmailRecipients(
  recipients: EmailRecipient | EmailRecipient[],
) {
  if (Array.isArray(recipients)) {
    return recipients.map(formatEmailAddress);
  }

  return formatEmailAddress(recipients);
}
