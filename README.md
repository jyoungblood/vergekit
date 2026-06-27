# Verge Kit

## A solid foundation for building web applications with Astro and Cloudflare Workers.

It starts with the pieces most full-stack apps need: server-rendered Astro, D1,
Drizzle, Better Auth, email, middleware, Zod validation, Astro Actions, and a
plain Tailwind UI base.

## What It Includes

- Astro in server mode with strict TypeScript.
- Cloudflare Workers adapter.
- Cloudflare D1 as the supported runtime database.
- Drizzle ORM and Drizzle Kit migrations.
- Better Auth with email/password, email verification, reset password, and D1
  storage.
- Middleware that loads auth state into typed `Astro.locals`.
- Route guards for public pages, protected pages, and protected API routes.
- Email provider abstraction for console, Cloudflare Email, Resend, Mailgun, and
  explicit Node SMTP usage.
- Auth email templates rendered with `@backstro/email`.
- Tailwind CSS v4.
- Local Astro UI components.
- Lucide Astro icons.
- Zod helpers for API request validation.
- Astro Actions example for form-backed mutations.
- CSRF origin checks through Astro config.
- Vitest, happy-dom, oxlint, Prettier, and `npm run verify`.

## Quickstart

Install dependencies:

```bash
npm install
```

Create local runtime secrets:

```bash
cp .dev.vars.example .dev.vars
```

Committed, non-secret app defaults live in `wrangler.jsonc` under `vars`.
Use `.dev.vars` only for local secrets or local-only overrides.

Generate a Better Auth secret:

```bash
openssl rand -base64 32
```

Paste the value into `.dev.vars`:

```bash
BETTER_AUTH_SECRET=your-generated-secret
```

Apply local D1 migrations:

```bash
npm run db:migrate:local
```

Start the app:

```bash
npm run dev
```

Open the local Astro URL shown in the terminal.

## Email Setup

The default local provider is `console`. It logs auth emails instead of sending
them.

For local auth flows with real email delivery, configure the provider before
testing registration, verification, or password reset. Put shared non-secret
provider configuration in `wrangler.jsonc`:

```jsonc
{
  "vars": {
    "EMAIL_PROVIDER": "resend",
    "EMAIL_FROM": "VK <noreply@example.com>",
  },
}
```

Put local provider secrets in `.dev.vars`:

```bash
RESEND_API_KEY=your-api-key
```

Supported provider names:

- `console`
- `cloudflare`
- `resend`
- `mailgun`
- `smtp-node`

`smtp-node` is for explicit Node usage. Cloudflare Workers should use
Cloudflare Email, Resend, Mailgun, or another fetch/binding-based provider.

## Runtime Configuration

Use `wrangler.jsonc` as the committed source of truth for non-secret Worker app
configuration:

```jsonc
{
  "vars": {
    "APP_NAME": "VK",
    "DATABASE_TARGET": "d1",
    "EMAIL_PROVIDER": "console",
  },
}
```

Typical non-secret values include `APP_NAME`, `DATABASE_TARGET`,
`EMAIL_PROVIDER`, `EMAIL_FROM`, `EMAIL_REPLY_TO`, `BETTER_AUTH_URL`, and
`MAILGUN_DOMAIN`. Do not put secret values in `wrangler.jsonc`.

Use `.dev.vars` for local secret values:

```bash
BETTER_AUTH_SECRET=your-local-secret
BETTER_AUTH_URL=http://localhost:4321
RESEND_API_KEY=your-local-resend-key
MAILGUN_API_KEY=your-local-mailgun-key
MAILGUN_DOMAIN=mg.example.com
```

Use Wrangler secrets for deployed secret values:

```bash
npx wrangler secret put BETTER_AUTH_SECRET
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put MAILGUN_API_KEY
```

Wrangler prompts for each value without storing it in the repo. If you deploy a
named environment, pass the environment name:

```bash
npx wrangler secret put BETTER_AUTH_SECRET --env production
```

## Common Commands

```bash
npm run dev                 # local Astro dev server
npm run build               # production build
npm run check               # Astro and TypeScript checks
npm run lint                # oxlint
npm run test                # Vitest
npm run verify              # check, lint, format check, tests, build
npm run db:generate         # generate Drizzle migrations
npm run db:migrate:local    # apply D1 migrations locally
npm run db:migrate:remote   # apply D1 migrations remotely
```
