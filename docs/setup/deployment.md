# Deployment Setup

VK deploys as an Astro server app on Cloudflare Workers. Keep runtime config in
Workers bindings, `wrangler.jsonc` vars, `.dev.vars` for local development, and
Wrangler secrets for deployed environments.

## Preflight

Run the same verification command locally and in CI:

```bash
npm run verify
```

This runs type checking, linting, Prettier checks, tests, and the production
build.

Build directly when investigating adapter or bundling issues:

```bash
npm run build
```

## Local Runtime Secrets

Copy the local example and fill in values:

```bash
cp .dev.vars.example .dev.vars
```

Use `.dev.vars` for local-only secrets such as `BETTER_AUTH_SECRET`, email API
keys, and local callback URLs. Do not commit `.dev.vars`.

## Deployed Secrets

Set deployed secrets with Wrangler. Better Auth always needs a stable secret:

```bash
npx wrangler secret put BETTER_AUTH_SECRET
```

Set provider-specific email secrets only when the selected provider needs them:

```bash
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put MAILGUN_API_KEY
```

Do not place secret values in `wrangler.jsonc`. Non-secret defaults such as
`APP_NAME`, `DATABASE_TARGET`, and `EMAIL_PROVIDER` can remain in
`wrangler.jsonc` vars.

## Deployment Checklist

1. Create the D1 database with `wrangler d1 create vk`.
2. Update the D1 `database_id` in `wrangler.jsonc`.
3. Configure `BETTER_AUTH_SECRET` and any provider credentials with
   `wrangler secret put`.
4. Run `npm run db:migrate:remote`.
5. Run `npm run verify`.
6. Deploy with the project Cloudflare workflow.
