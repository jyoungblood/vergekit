# Verge Kit


Verge Kit is a solid foundation for building web apps with [Astro](https://astro.build) and the [Cloudflare Workers](https://workers.dev) ecosystem.

It's a pre-wired stack of dependencies and minimal boilerplate designed to help LLMs produce reliable and understandable applications.

Start new apps with low effort and high confidence.















## The Stack

- [Astro](https://astro.build) - SSR with strict
  [TypeScript](https://www.typescriptlang.org) and [Cloudflare Workers](https://workers.dev) adapter
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Drizzle](https://orm.drizzle.team)
- [Better Auth](https://www.better-auth.com) w/ [admin plugin](https://www.better-auth.com/docs/plugins/admin)
- [Tailwind CSS](https://tailwindcss.com)
- [bejamas/ui](https://ui.bejamas.com") components (based on [shadcn/ui](https://ui.shadcn.com/))
- [Lucide Astro](https://lucide.dev/guide/astro) icons
- [Vitest](https://vitest.dev), [happy-dom](https://github.com/capricorn86/happy-dom), [oxlint](https://oxc.rs/docs/guide/usage/linter.html)
- [`@backstro/email`](https://github.com/backstrojs/email) templates (based on [react-email](https://react.email/))




## Boilerplate


We've also configured middleware, basic auth flows, route protection, user roles, and transactional email utilities.

- Email providers for console,
  [Cloudflare Email](https://developers.cloudflare.com/email-service/),
  [Resend](https://resend.com), [Mailgun](https://www.mailgun.com), and explicit
  [Node](https://nodejs.org) SMTP usage

- CSRF origin checks through [Astro config](https://docs.astro.build/en/guides/security/)

and local Astro UI components

and verification scripts
  helper scripts

with email/password, email
  verification, reset password, and D1 storage
  roles for `admin`, `moderator`, `user`, and `banned`
- Register, login, logout, email verification, forgot password, and reset
  password flows
- Middleware that loads auth state into typed `Astro.locals`
- Public-by-default route auth with opt-in protected pages and APIs
- Custom 404 and 500 error pages
- API response helpers



## Getting Started

Install the latest version:
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

Manual installation instructions: https://vergekit.com/docs/installation/

Apply local D1 migrations:

```bash
npm run db:migrate:local
```

Optionally create a verified local user with the `admin` role after migrations:

```bash
npm run init:admin
```

Configure the email provider before testing registration, verification, or password reset. Put shared non-secret provider configuration in `wrangler.jsonc`:

```jsonc
{
  "vars": {
    "EMAIL_PROVIDER": "resend",
    "EMAIL_FROM": "VK <noreply@example.com>",
  },
}
```

For local auth flows with real email delivery, put local provider secrets in `.dev.vars`:

```bash
RESEND_API_KEY=your-api-key
```


Start the app:

```bash
npm run dev
```





## Documentation

?? support
?? license


See the [configuration guide](https://vergekit.com/docs/setup/runtime-configuration/)



