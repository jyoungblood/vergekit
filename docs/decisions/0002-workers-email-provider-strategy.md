# 0002. Workers Email Provider Strategy

Date: 2026-06-19

Status: Accepted

## Context

Authentication flows need email for verification and password resets, but local
development should not require a paid provider or real outbound delivery. The
runtime also needs to stay compatible with Cloudflare Workers without carrying
Node-only mail adapters that are not part of the deployed path.

## Decision

VK selects email delivery with the `EMAIL_PROVIDER` Worker variable. Committed
non-secret app values live in `wrangler.jsonc` vars. The default provider is
`console`, which renders messages to logs for local development and tests.
Production Workers can use Cloudflare Email through the `EMAIL` binding or HTTP
API providers such as Resend and Mailgun.

SMTP delivery is not exposed as a VK provider. Cloudflare Email does offer an
authenticated SMTP endpoint for SMTP-capable applications, but this project keeps
the Worker app on Cloudflare's binding and fetch-based providers.

Provider credentials are secrets. Local secrets belong in `.dev.vars`, and
deployed values belong in Wrangler secrets, for example
`wrangler secret put BETTER_AUTH_SECRET` or the provider-specific API key. Secrets
must not be committed in `wrangler.jsonc` or `.dev.vars.example`.

## Consequences

- New apps can run auth email flows locally with no third-party account.
- Production email configuration can change without changing auth code.
- Secret handling is consistent across auth and email providers.
- Workers runtime support stays aligned with Cloudflare-native bindings and
  fetch-based providers, without a local-only SMTP dependency.
