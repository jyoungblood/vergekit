# Verge Kit

## A solid foundation for building web applications with Astro and Cloudflare Workers.

It starts with the pieces most full-stack apps need: server-rendered Astro, D1,
Drizzle, Better Auth, email, middleware, Zod validation, Astro Actions, and a
plain Tailwind UI base.

## What It Includes

- Astro in server mode with strict TypeScript
- Cloudflare Workers adapter
- Cloudflare D1 as the supported runtime database
- Drizzle ORM and Drizzle Kit migrations
- Better Auth with email/password, email verification, reset password, and D1
  storage
- Better Auth admin plugin roles for `admin`, `moderator`, `user`, and
  `banned`
- Middleware that loads auth state into typed `Astro.locals`
- Public-by-default route auth with opt-in protected pages and APIs
- Custom 404 and 500 error pages
- Email provider abstraction for console, Cloudflare Email, Resend, Mailgun, and
  explicit Node SMTP usage
- Auth email templates rendered with `@backstro/email`
- Tailwind CSS v4
- Local Astro UI components
- Lucide Astro icons
- Zod helpers for API request validation
- Astro Actions example for form-backed mutations
- CSRF origin checks through Astro config
- Vitest, happy-dom, oxlint, and `npm run verify`

## Quickstart

Clone the repository
```bash
npm create vergekit@latest my-app
```

Install dependencies:

```bash
cd my-app
npm install
```

Create local runtime secrets. For first-time setup, this copies the template and
writes a fresh Better Auth secret:

```bash
cp .dev.vars.example .dev.vars && secret="$(openssl rand -base64 32)" && awk -v secret="$secret" 'BEGIN { done = 0 } /^BETTER_AUTH_SECRET=/ { print "BETTER_AUTH_SECRET=" secret; done = 1; next } { print } END { if (!done) print "BETTER_AUTH_SECRET=" secret }' .dev.vars > .dev.vars.tmp && mv .dev.vars.tmp .dev.vars
```

Or do the same manually:

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

Optionally create a verified local user with the `admin` role after migrations:

```bash
npm run init:admin
```

This writes directly to D1 with Wrangler and does not require `npm run dev`.

The default database setup is Cloudflare D1 through the `DB` binding in
`wrangler.jsonc`. Local dev uses Wrangler/Miniflare-backed D1 state through the
Astro Cloudflare adapter; no separate Miniflare config is required after
`npm install`. See [D1 Setup](docs/setup/d1.md) for production database setup
and alternate local or Cloudflare-hosted dev database options.

All routes are public until they opt into auth. Add protected exact paths or URL
prefixes in `src/config/auth.ts`, or check `Astro.locals.isAuthenticated`
inside a specific page or route handler. See
[Route Authentication](docs/setup/auth-routes.md) for examples.

Better Auth plugins are configured in `src/auth/server.ts` and
`src/auth/client.ts`. The admin plugin is already installed and configured for
the app role model. See [Route Authentication](docs/setup/auth-routes.md) for
the plugin files that usually need to change when adding or modifying Better
Auth plugins.

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

For direct `sendEmail` examples, provider requirements, auth-email helpers, and
testing notes, see [Email Sending](docs/setup/email.md).

## Runtime Configuration

See [Configuration Guide](docs/setup/configuration.md) for the full split between
source config, Worker runtime vars, local secrets, and deployed secrets.

In short: editable app defaults used by source code live in `src/config`.
Runtime Worker values live in `wrangler.jsonc` vars. Local secrets live in
`.dev.vars`, and deployed secrets live in Wrangler secrets.

Use `wrangler.jsonc` as the committed source of truth for non-secret Worker app
configuration:

```jsonc
{
  "vars": {
    "EMAIL_PROVIDER": "console",
  },
}
```

Typical non-secret runtime values include `EMAIL_PROVIDER`, `EMAIL_FROM`,
`EMAIL_REPLY_TO`, `BETTER_AUTH_URL`, and `MAILGUN_DOMAIN`. App identity and
route policy live in `src/config`. Do not put secret values in
`wrangler.jsonc`.

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
npm run verify              # check, lint, tests, build
npm run db:generate         # generate Drizzle migrations
npm run db:studio           # open Drizzle Studio for D1 HTTP
npm run db:migrate:local    # apply D1 migrations locally
npm run db:migrate:remote   # apply D1 migrations remotely
npm run init:admin          # create a verified D1 user with the admin role
```
