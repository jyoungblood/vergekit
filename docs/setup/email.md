# Email Sending

VK sends mail through the provider abstraction in `src/email/send.ts`. The main
entry point is `sendEmail(runtimeEnv, input)`, which resolves the configured
provider from `runtimeEnv.EMAIL_PROVIDER` and sends one message with the common
`SendEmailInput` shape.

## Direct Sends

Use `sendEmail` from Worker or Astro server code when a route needs to send a
custom transactional email.

```ts
import { env } from 'cloudflare:workers';
import { sendEmail } from '@/email/send';

const result = await sendEmail(env, {
  to: { email: 'customer@example.com', name: 'Customer Name' },
  from: { email: 'noreply@example.com', name: 'VK' },
  subject: 'Your VK receipt',
  html: '<p>Thanks for your order.</p>',
  text: 'Thanks for your order.',
  replyTo: 'support@example.com',
});

console.info('sent email', result.provider, result.id);
```

`to` can be a single email address, a named address object, or an array of
either form. `from` and `replyTo` accept the same address forms.

Always include both `html` and `text`. The abstraction requires both so every
message has a plain-text fallback.

`sendEmail` does not automatically read `EMAIL_FROM` for direct sends. Pass
`from` in the message input. `EMAIL_FROM` is used by the auth-email helper
described below.

## Provider Configuration

The provider is selected by `EMAIL_PROVIDER`. When it is missing, the
abstraction uses `console`.

- `console`: Requires no config. Logs the email payload and returns
  `{ provider: 'console', id: 'console' }`. This is the local default.
- `cloudflare`: Requires the `EMAIL` binding. Uses the Worker `send_email`
  binding configured in `wrangler.jsonc`.
- `resend`: Requires `RESEND_API_KEY`. Sends with the Resend HTTP API.
- `mailgun`: Requires `MAILGUN_API_KEY` and `MAILGUN_DOMAIN`. Sends with the
  Mailgun HTTP API.

SMTP/Nodemailer adapters are intentionally not part of this Worker runtime
surface. Prefer the Cloudflare Email binding for deployed Workers, or a
fetch-based provider when an external email service is required.

Put shared, non-secret configuration in `wrangler.jsonc`:

```jsonc
{
  "vars": {
    "EMAIL_PROVIDER": "resend",
    "EMAIL_FROM": "VK <noreply@example.com>",
    "EMAIL_REPLY_TO": "support@example.com",
    "MAILGUN_DOMAIN": "mg.example.com",
  },
}
```

Put local secrets in `.dev.vars`:

```bash
RESEND_API_KEY=your-local-resend-key
MAILGUN_API_KEY=your-local-mailgun-key
```

For deployed Workers, set provider secrets with Wrangler:

```bash
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put MAILGUN_API_KEY
```

Only configure the secret for the provider the environment uses.

## Auth Emails

Verification and password-reset emails use the higher-level auth helper:

```ts
import { env } from 'cloudflare:workers';
import { createAuthEmailSenderFromEnv } from '@/email/send';

const authEmail = createAuthEmailSenderFromEnv(env);

await authEmail.sendVerificationEmail({
  to: 'customer@example.com',
  name: 'Customer Name',
  url: 'https://example.com/auth/verify?token=...',
});
```

`createAuthEmailSenderFromEnv` renders the Backstro auth templates and resolves
the sender from `EMAIL_FROM`. With `EMAIL_PROVIDER=console`, it falls back to
`noreply@example.test` and the app name from `src/config/app.ts`.

Use this helper for Better Auth verification and reset flows. Use `sendEmail`
directly for other transactional messages.

## Error Handling

`sendEmail` rejects when required provider configuration is missing or when the
selected provider returns an error. Callers should catch errors at the route or
job boundary and avoid exposing provider response bodies to users.

```ts
try {
  await sendEmail(env, message);
} catch (error) {
  console.error('Email send failed', error);
}
```

The returned `id` is optional because provider responses differ. Store it only
as diagnostic metadata.

## Tests

Use the `console` provider for tests that only need to assert that a send was
requested:

```ts
const info = vi.fn();

const result = await sendEmail(
  { EMAIL_PROVIDER: 'console' },
  {
    to: 'customer@example.com',
    from: 'noreply@example.test',
    subject: 'Test email',
    html: '<p>Hello</p>',
    text: 'Hello',
  },
  { console: { info } },
);

expect(result).toEqual({ provider: 'console', id: 'console' });
expect(info).toHaveBeenCalledWith('[email:console]', expect.any(Object));
```

For Resend or Mailgun provider tests, pass `options.fetcher` to stub HTTP
requests without calling the real provider.
