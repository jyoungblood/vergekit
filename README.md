# VK

VK is a small Astro application boilerplate for Cloudflare Workers.

It starts with the pieces most full-stack apps need: server-rendered Astro, D1,
Drizzle, Better Auth, email, middleware, Zod validation, Astro Actions, and a
plain Tailwind UI base.

The goal is not to be a framework. The goal is to be a clean starting point that
uses the platform and the stack directly.

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
- Hyperdrive proof tests for future PostgreSQL/MySQL support. Runtime support is
  D1 only for now.

## Main Dependencies

- `astro`
- `@astrojs/cloudflare`
- `better-auth`
- `@better-auth/drizzle-adapter`
- `drizzle-orm`
- `drizzle-kit`
- `tailwindcss`
- `@tailwindcss/vite`
- `@backstro/email`
- `zod`
- `wrangler`
- `vitest`
- `happy-dom`
- `oxlint`
- `prettier`

## Quickstart

Install dependencies:

```bash
npm install
```

Create local runtime variables:

```bash
cp .dev.vars.example .dev.vars
```

Generate a Better Auth secret:

```bash
openssl rand -base64 32
```

Paste the value into `.dev.vars`:

```bash
BETTER_AUTH_SECRET=your-generated-secret
```

Or update it from the shell:

```bash
secret="$(openssl rand -base64 32)" && awk -v secret="$secret" 'BEGIN { done = 0 } /^BETTER_AUTH_SECRET=/ { print "BETTER_AUTH_SECRET=" secret; done = 1; next } { print } END { if (!done) print "BETTER_AUTH_SECRET=" secret }' .dev.vars > .dev.vars.tmp && mv .dev.vars.tmp .dev.vars
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

For full auth flows with real email delivery, configure email before testing
registration, verification, or password reset:

```bash
EMAIL_PROVIDER=resend
EMAIL_FROM="VK <noreply@example.com>"
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

## Common Commands

```bash
npm run dev              # local Astro dev server
npm run build            # production build
npm run check            # Astro and TypeScript checks
npm run lint             # oxlint
npm run test             # Vitest
npm run verify           # check, lint, format check, tests, build
npm run db:generate      # generate Drizzle migrations
npm run db:migrate:local # apply D1 migrations locally
npm run db:migrate:remote # apply D1 migrations remotely
```

## Database Position

VK is D1-first.

App code should use the local `src/db` modules instead of importing a Drizzle
dialect directly in routes, actions, or UI code. This keeps a clear path for
future Hyperdrive-backed PostgreSQL or MySQL support without changing ordinary
application query call sites.

PostgreSQL and MySQL are proof targets only in this release.

## Public Docs

Draft public docs live in `public-docs/`:

- `overview.md`
- `installation.md`
- `deployment.md`
- `core-concepts.md`
- `marketing-hero.md`
