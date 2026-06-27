# Deployment Setup

VK deploys as an Astro server app on Cloudflare Workers. Keep committed
runtime config in Workers bindings and `wrangler.jsonc` vars. Keep local secret
values in `.dev.vars`, and set deployed secret values with Wrangler secrets.

## Preflight

Run the same verification command locally and in CI:

```bash
npm run verify
```

This runs type checking, linting, tests, and the production build.

Build directly when investigating adapter or bundling issues:

```bash
npm run build
```

## Runtime Variables

Use `wrangler.jsonc` as the committed source of truth for non-secret app-level
Worker variables:

```jsonc
{
  "vars": {
    "APP_NAME": "VK",
    "DATABASE_TARGET": "d1",
    "EMAIL_PROVIDER": "console",
    "BETTER_AUTH_URL": "https://example.com",
    "EMAIL_FROM": "VK <noreply@example.com>",
    "MAILGUN_DOMAIN": "mg.example.com",
  },
}
```

Typical non-secret values are `APP_NAME`, `DATABASE_TARGET`, `EMAIL_PROVIDER`,
`EMAIL_FROM`, `EMAIL_REPLY_TO`, `BETTER_AUTH_URL`, and `MAILGUN_DOMAIN`. If you
use named Wrangler environments, define the `vars` block inside each environment
because Wrangler does not inherit `vars` from the top level.

## Local Secrets

Copy the local example and fill in values:

```bash
cp .dev.vars.example .dev.vars
```

Use `.dev.vars` for local-only secrets such as `BETTER_AUTH_SECRET`, email API
keys, and local callback URLs. You can also use it for local-only overrides of
non-secret values from `wrangler.jsonc`. Do not commit `.dev.vars`.

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

Wrangler prompts for each value. Do not pass secret values as command arguments,
print them in shell history, or commit them to `wrangler.jsonc`.

If you deploy with a named Wrangler environment, pass the environment name when
setting the secret:

```bash
npx wrangler secret put BETTER_AUTH_SECRET --env production
```

List configured secret names when auditing an environment:

```bash
npx wrangler secret list
npx wrangler secret list --env production
```

## Deployment Checklist

1. Create the D1 database with `wrangler d1 create vk`.
2. Update the D1 `database_id` in `wrangler.jsonc`.
3. Configure non-secret app values in `wrangler.jsonc`.
4. Configure `BETTER_AUTH_SECRET` and any provider credentials with
   `wrangler secret put`.
5. Run `npm run db:migrate:remote`.
6. Optionally create a verified admin user with
   `npm run init:admin -- --remote`.
7. Run `npm run verify`.
8. Deploy with the project Cloudflare workflow.
