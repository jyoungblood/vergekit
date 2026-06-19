# VK Boilerplate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a D1-first Astro boilerplate for Cloudflare Workers with strict TypeScript, Better Auth, Drizzle, Zod conventions, Tailwind 4, Backstro email templates, and adapter seams for future Hyperdrive PostgreSQL/MySQL support.

**Architecture:** VK starts as an Astro server-rendered app deployed through the Cloudflare Workers adapter. D1 is the only supported runtime database in the first milestone, but all app code uses a stable `src/db` import surface so future Hyperdrive drivers can be added without rewriting app-level queries. Framework-like helpers stay thin, local, and easily extractable later.

**Tech Stack:** Astro, `@astrojs/cloudflare`, Cloudflare Workers, D1, Drizzle ORM, Drizzle Kit, Better Auth, Zod, Tailwind CSS 4, Bejamas UI patterns, `@lucide/astro`, `@backstro/email`, Vitest, happy-dom, Prettier, oxlint, npm.

---

## Source References

- Article inspiration: https://flori.dev/reads/astro-to-the-moon-and-back/
- Astro Cloudflare adapter: https://docs.astro.build/en/guides/integrations-guide/cloudflare/
- Astro TypeScript: https://docs.astro.build/en/guides/typescript/
- Astro Actions: https://docs.astro.build/en/guides/actions/
- Astro middleware: https://docs.astro.build/en/guides/middleware/
- Astro security `checkOrigin`: https://docs.astro.build/en/reference/configuration-reference/#securitycheckorigin
- Better Auth Astro: https://better-auth.com/docs/integrations/astro
- Better Auth Drizzle adapter: https://better-auth.com/docs/adapters/drizzle
- Drizzle D1: https://orm.drizzle.team/docs/connect-cloudflare-d1
- Cloudflare D1: https://developers.cloudflare.com/d1/
- Cloudflare Hyperdrive PostgreSQL: https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/
- Cloudflare Hyperdrive MySQL: https://developers.cloudflare.com/hyperdrive/examples/connect-to-mysql/
- Cloudflare Rate Limiting binding: https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/
- Cloudflare Email Workers API: https://developers.cloudflare.com/email-service/api/send-emails/workers-api/
- Backstro email: https://github.com/backstrojs/email
- Lucide Astro: https://lucide.dev/guide/astro/
- Bejamas UI: https://ui.bejamas.com/

## File Structure Target

```text
.
├── astro.config.mjs
├── drizzle.config.ts
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── wrangler.jsonc
├── drizzle/
│   └── d1/
├── docs/
│   ├── roadmap.md
│   ├── agent-prompts/
│   └── superpowers/plans/
├── src/
│   ├── actions/
│   ├── auth/
│   ├── components/
│   ├── config/
│   ├── db/
│   ├── email/
│   ├── layouts/
│   ├── lib/
│   │   └── http/
│   ├── middleware.ts
│   ├── pages/
│   └── styles/
└── tests/
    ├── auth/
    ├── db/
    ├── email/
    └── http/
```

## Cross-Slice Guardrails

- D1 is the only runtime database until a later Hyperdrive slice.
- App code must not import `drizzle-orm/d1` directly outside `src/db`.
- Raw SQL must be avoided unless isolated behind a named helper that documents dialect assumptions.
- Use `crypto.randomUUID()` for IDs in app-owned tables unless a Drizzle/Better Auth schema requires a different format.
- Use npm scripts and Node-compatible tooling, not Bun.
- Do not use Vue, React, Svelte, shadcn, Radix, Alpine, or HTMX in the foundation.
- Do not use the Browser skill for preview/debugging unless the user explicitly asks.

## Slice 1: Foundation

**Files:**
- Create or modify: `package.json`
- Create or modify: `astro.config.mjs`
- Create or modify: `tsconfig.json`
- Create: `wrangler.jsonc`
- Create: `vitest.config.ts`
- Create: `.gitignore`
- Create: `src/styles/global.css`
- Create: `src/layouts/BaseLayout.astro`
- Create or modify: `src/pages/index.astro`
- Modify: `docs/roadmap.md`

- [ ] **Step 1: Initialize git if needed**

Run:

```bash
test -d .git || git init
```

Expected: `.git` exists after the command.

- [ ] **Step 2: Scaffold Astro minimal app**

Run:

```bash
npm create astro@latest . -- --template minimal --typescript strict --install
```

Expected: Astro project files are created in the current directory. If the command prompts because the directory is not empty, choose the option that keeps existing `docs/` files and creates the app in place.

- [ ] **Step 3: Install runtime dependencies**

Run:

```bash
npm install @astrojs/cloudflare @tailwindcss/vite tailwindcss @lucide/astro zod
```

Expected: dependencies are added to `package.json`.

- [ ] **Step 4: Install dev dependencies**

Run:

```bash
npm install -D wrangler vitest happy-dom prettier prettier-plugin-astro oxlint
```

Expected: dev dependencies are added to `package.json`.

- [ ] **Step 5: Configure package scripts**

Update `package.json` scripts to include:

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "lint": "oxlint .",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "vitest run",
    "test:watch": "vitest",
    "verify": "npm run check && npm run lint && npm run format:check && npm run test && npm run build"
  }
}
```

- [ ] **Step 6: Configure Astro for Cloudflare and Tailwind**

Replace `astro.config.mjs` with:

```js
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
  security: {
    checkOrigin: true,
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
```

- [ ] **Step 7: Configure TypeScript**

Replace `tsconfig.json` with:

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist", ".wrangler"],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },
    "verbatimModuleSyntax": true
  }
}
```

- [ ] **Step 8: Add Wrangler config**

Create `wrangler.jsonc`:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "vk",
  "compatibility_date": "2026-06-19",
  "compatibility_flags": ["nodejs_compat"],
  "observability": {
    "enabled": true
  },
  "vars": {
    "APP_NAME": "VK",
    "DATABASE_TARGET": "d1",
    "EMAIL_PROVIDER": "console"
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "vk",
      "database_id": "00000000-0000-0000-0000-000000000000",
      "migrations_dir": "drizzle/d1"
    }
  ]
}
```

- [ ] **Step 9: Add global styles**

Create `src/styles/global.css`:

```css
@import "tailwindcss";

:root {
  color-scheme: light;
}

html {
  min-height: 100%;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
}

body {
  min-height: 100%;
  margin: 0;
  background: #f8fafc;
  color: #111827;
}

button,
input,
textarea,
select {
  font: inherit;
}
```

- [ ] **Step 10: Add base layout**

Create `src/layouts/BaseLayout.astro`:

```astro
---
import '../styles/global.css';

interface Props {
  title?: string;
}

const { title = 'VK' } = Astro.props;
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <meta name="generator" content={Astro.generator} />
    <title>{title}</title>
  </head>
  <body>
    <slot />
  </body>
</html>
```

- [ ] **Step 11: Add index page with Lucide Astro**

Replace `src/pages/index.astro`:

```astro
---
import { Rocket } from '@lucide/astro';
import BaseLayout from '@/layouts/BaseLayout.astro';
---

<BaseLayout title="VK">
  <main class="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
    <div class="flex items-center gap-3 text-sm font-medium text-slate-600">
      <Rocket size={18} aria-hidden="true" />
      <span>VK Boilerplate</span>
    </div>

    <h1 class="mt-5 text-4xl font-semibold tracking-normal text-slate-950">
      D1-first Astro app base for Cloudflare Workers.
    </h1>

    <p class="mt-4 max-w-2xl text-base leading-7 text-slate-600">
      This starter keeps the first app small while preserving seams for auth,
      database adapters, forms, email, and future Hyperdrive support.
    </p>
  </main>
</BaseLayout>
```

- [ ] **Step 12: Add Vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
  },
});
```

- [ ] **Step 13: Add gitignore**

Ensure `.gitignore` contains:

```gitignore
node_modules/
dist/
.astro/
.wrangler/
.dev.vars
.env
.env.local
npm-debug.log*
```

- [ ] **Step 14: Verify Slice 1**

Run:

```bash
npm run check
npm run lint
npm run format:check
npm run build
```

Expected: all commands exit with status `0`.

- [ ] **Step 15: Update tracker and commit**

Update `docs/roadmap.md` Slice 1 status from `Not started` to `Done`, then run:

```bash
git add .
git commit -m "chore: scaffold astro cloudflare foundation"
```

Expected: commit succeeds.

## Slice 2: D1 Database Contract

**Files:**
- Create: `drizzle.config.ts`
- Create: `drizzle/d1/.gitkeep`
- Create: `src/db/schema/app.ts`
- Create: `src/db/schema/index.ts`
- Create: `src/db/target.ts`
- Create: `src/db/client.ts`
- Create: `tests/db/db-target.test.ts`
- Create: `tests/db/portable-query-shape.test.ts`
- Modify: `package.json`
- Modify: `docs/roadmap.md`

- [ ] **Step 1: Add Drizzle dependencies**

Run:

```bash
npm install drizzle-orm
npm install -D drizzle-kit tsx
```

Expected: dependencies are added.

- [ ] **Step 2: Add database scripts**

Add scripts to `package.json`:

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:studio": "drizzle-kit studio",
    "db:migrate:local": "wrangler d1 migrations apply vk --local",
    "db:migrate:remote": "wrangler d1 migrations apply vk --remote"
  }
}
```

Keep existing scripts from Slice 1.

- [ ] **Step 3: Add database target parser test**

Create `tests/db/db-target.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { parseDatabaseTarget } from '@/db/target';

describe('parseDatabaseTarget', () => {
  it('accepts d1 as the only implemented target', () => {
    expect(parseDatabaseTarget('d1')).toBe('d1');
  });

  it('rejects future targets until their adapters are implemented', () => {
    expect(() => parseDatabaseTarget('pg')).toThrow('Database target pg is not implemented');
    expect(() => parseDatabaseTarget('mysql')).toThrow('Database target mysql is not implemented');
  });
});
```

- [ ] **Step 4: Run target parser test and confirm failure**

Run:

```bash
npm run test -- tests/db/db-target.test.ts
```

Expected: fail because `src/db/target.ts` does not exist.

- [ ] **Step 5: Implement database target parser**

Create `src/db/target.ts`:

```ts
export type ImplementedDatabaseTarget = 'd1';
export type FutureDatabaseTarget = 'pg' | 'mysql';
export type DatabaseTarget = ImplementedDatabaseTarget | FutureDatabaseTarget;

const implementedTargets = new Set<string>(['d1']);
const knownTargets = new Set<string>(['d1', 'pg', 'mysql']);

export function parseDatabaseTarget(value: string | undefined): ImplementedDatabaseTarget {
  const target = value ?? 'd1';

  if (!knownTargets.has(target)) {
    throw new Error(`Unknown database target ${target}`);
  }

  if (!implementedTargets.has(target)) {
    throw new Error(`Database target ${target} is not implemented`);
  }

  return target as ImplementedDatabaseTarget;
}
```

- [ ] **Step 6: Run parser test and confirm pass**

Run:

```bash
npm run test -- tests/db/db-target.test.ts
```

Expected: pass.

- [ ] **Step 7: Add app schema**

Create `src/db/schema/app.ts`:

```ts
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const appSettings = sqliteTable('app_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});
```

Create `src/db/schema/index.ts`:

```ts
export * from './app';
```

- [ ] **Step 8: Add Drizzle config**

Create `drizzle.config.ts`:

```ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  driver: 'd1-http',
  schema: './src/db/schema/index.ts',
  out: './drizzle/d1',
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID ?? 'local',
    databaseId: process.env.CLOUDFLARE_DATABASE_ID ?? 'local',
    token: process.env.CLOUDFLARE_D1_TOKEN ?? 'local',
  },
});
```

- [ ] **Step 9: Add D1 client factory**

Create `src/db/client.ts`:

```ts
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export type AppDatabase = ReturnType<typeof createD1Database>;

export function createD1Database(binding: D1Database) {
  return drizzle(binding, { schema });
}
```

- [ ] **Step 10: Add portability query shape test**

Create `tests/db/portable-query-shape.test.ts`:

```ts
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { appSettings } from '@/db/schema';

describe('portable app query shapes', () => {
  it('keeps app settings queries in the drizzle query builder subset', () => {
    const keyFilter = eq(appSettings.key, 'site.title');
    expect(keyFilter).toBeDefined();
  });
});
```

- [ ] **Step 11: Verify Slice 2**

Run:

```bash
npm run test -- tests/db
npm run check
npm run db:generate
```

Expected: tests and typecheck pass, and Drizzle writes a D1 migration under `drizzle/d1`.

- [ ] **Step 12: Update tracker and commit**

Update `docs/roadmap.md` Slice 2 status from `Not started` to `Done`, then run:

```bash
git add .
git commit -m "feat: add d1 database contract"
```

Expected: commit succeeds.

## Slice 3: Auth Spine

**Files:**
- Create: `src/auth/server.ts`
- Create: `src/auth/client.ts`
- Create: `src/auth/routes.ts`
- Create: `src/pages/api/auth/[...all].ts`
- Create: `src/middleware.ts`
- Modify: `src/env.d.ts`
- Extend: `src/db/schema/auth.ts`
- Create: `tests/auth/public-paths.test.ts`
- Create: `tests/middleware/route-access.test.ts`
- Modify: `docs/roadmap.md`

Implementation notes:
- Use Better Auth’s Astro catch-all route convention.
- Configure Better Auth with Drizzle adapter provider `sqlite`.
- Enable email/password in the first pass.
- Include plugin imports/config seams for `admin`, `organization`, `passkey`, and `twoFactor` only after their generated schema is represented.
- Add typed `App.Locals` with `user`, `session`, and `isAuthenticated`.
- Route policy should live in `src/auth/routes.ts`, not hard-coded through pages.

Verification:

```bash
npm run test -- tests/auth tests/middleware
npm run check
npm run build
```

Commit:

```bash
git add .
git commit -m "feat: add better auth middleware spine"
```

## Slice 4: Email Layer

**Files:**
- Create: `src/email/types.ts`
- Create: `src/email/providers/console.ts`
- Create: `src/email/providers/cloudflare.ts`
- Create: `src/email/providers/resend.ts`
- Create: `src/email/providers/mailgun.ts`
- Create: `src/email/providers/smtp-node.ts`
- Create: `src/email/send.ts`
- Create: `src/email/templates/auth/VerifyEmail.astro`
- Create: `src/email/templates/auth/ResetPassword.astro`
- Create: `tests/email/send-email.test.ts`
- Modify: `src/auth/server.ts`
- Modify: `docs/roadmap.md`

Implementation notes:
- The provider interface should accept `{ to, from, subject, html, text, replyTo }`.
- `console` is the default provider for local development.
- Cloudflare Email binding and HTTP API providers are production-safe for Workers.
- Node SMTP via Nodemailer is an explicit Node/local adapter, not the default Workers path.
- Render templates with `@backstro/email/render`.

Verification:

```bash
npm run test -- tests/email
npm run check
```

Commit:

```bash
git add .
git commit -m "feat: add provider-based email layer"
```

## Slice 5: Form And API Conventions

**Files:**
- Create: `src/lib/http/json.ts`
- Create: `src/lib/http/parse.ts`
- Create: `src/actions/index.ts`
- Create: `src/actions/app-settings.ts`
- Create: `src/pages/api/health.ts`
- Create: `tests/http/json.test.ts`
- Create: `tests/http/parse.test.ts`
- Create: `tests/actions/app-settings.test.ts`
- Modify: `docs/roadmap.md`

Implementation notes:
- Standard success shape is `{ data: T }`.
- Standard failure shape is `{ error: string, issues?: unknown }`.
- Use Zod `safeParse`, not `parse`, for API boundaries.
- Astro Actions are preferred for app-owned form mutations.
- `/api/*` endpoints remain for external JSON integrations and Better Auth.

Verification:

```bash
npm run test -- tests/http tests/actions
npm run check
npm run build
```

Commit:

```bash
git add .
git commit -m "feat: add form and api conventions"
```

## Slice 6: Minimal Auth UI

**Files:**
- Create: `src/components/ui/Button.astro`
- Create: `src/components/ui/Input.astro`
- Create: `src/components/ui/Field.astro`
- Create: `src/components/auth/AuthShell.astro`
- Create: `src/pages/login.astro`
- Create: `src/pages/register.astro`
- Create: `src/pages/auth/forgot-password.astro`
- Create: `src/pages/auth/reset-password.astro`
- Create: `src/pages/auth/verify-email.astro`
- Create: `src/pages/dashboard.astro`
- Modify: `docs/roadmap.md`

Implementation notes:
- Use Bejamas UI as copy-and-own design inspiration.
- Use Astro-native components and `@lucide/astro` icons.
- Keep all forms server-first and progressively enhance only when needed.
- Ask the user to verify pages visually instead of using the Browser skill.

Verification:

```bash
npm run check
npm run build
```

Commit:

```bash
git add .
git commit -m "feat: add minimal auth ui"
```

## Slice 7: Operational Polish

**Files:**
- Create: `.env.example`
- Create: `.dev.vars.example`
- Create: `docs/decisions/0001-d1-first-adapter-ready.md`
- Create: `docs/decisions/0002-workers-email-provider-strategy.md`
- Create: `docs/setup/d1.md`
- Create: `docs/setup/deployment.md`
- Modify: `package.json`
- Modify: `docs/roadmap.md`

Implementation notes:
- Add `npm run verify` if not already present.
- Document local D1 setup with Wrangler.
- Document secrets as local `.dev.vars` and deployed Wrangler secrets, not committed config.
- Explain why Hyperdrive is a planned adapter target rather than initial runtime support.

Verification:

```bash
npm run verify
```

Commit:

```bash
git add .
git commit -m "docs: add setup and architecture decisions"
```

## Slice 8: Hyperdrive Proof

Status: deferred until Milestone 1 is complete.

Goal: prove the database seam can support Hyperdrive PostgreSQL and MySQL without changing app-level query call sites. This slice should add adapter tests and documentation, not production Hyperdrive support.

Expected work:
- Add `src/db/hyperdrive/pg.ts` and `src/db/hyperdrive/mysql.ts` behind test-only imports.
- Add schema comparison notes for D1 SQLite, PostgreSQL, and MySQL.
- Add a test that imports the same repository/query helper against multiple target factories.
- Document query patterns that are portable and patterns that require dialect-specific helpers.

Verification will be defined when the slice starts, based on the selected local database test strategy.

## Plan Self-Review

- Spec coverage: The plan covers Astro Cloudflare foundation, D1-first Drizzle, Better Auth, middleware, Zod conventions, Tailwind 4, Lucide Astro, Backstro email, testing, oxlint, and future Hyperdrive constraints.
- Placeholder scan: This plan uses explicit file paths, commands, and first-slice code. Later slices intentionally describe exact files, boundaries, verification, and commits while deferring line-level code to their own one-context implementation plans.
- Type consistency: Database target names are consistently `d1`, `pg`, and `mysql`; the D1 binding is consistently `DB`; the app database import surface is consistently `src/db`.
