# VK Boilerplate Roadmap

This tracker breaks the boilerplate into slices small enough for one focused agent context each. Each slice should end with committed code, passing verification commands, and a short note updating this tracker.

## Architecture Principle

VK is D1-first and adapter-ready. The first implementation supports Cloudflare D1 only, while app code imports database behavior through stable local modules that can later route to Hyperdrive-backed PostgreSQL or MySQL implementations. App query code must stay inside a conservative Drizzle query-builder subset unless a dialect-specific helper is explicitly introduced.

## Slice Tracker

| Slice                       | Status      | Goal                                                                                                                              | Verification                                                                    |
| --------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 1. Foundation               | Done        | Scaffold Astro on Cloudflare Workers with strict TypeScript, Tailwind 4, baseline tooling, and deployment config.                 | `npm run check`, `npm run build`, `npm run lint`                                |
| 2. D1 Database Contract     | Not started | Add Drizzle D1 schema, adapter-ready `src/db` surface, and portability proof tests.                                               | `npm run test -- tests/db`, `npm run db:generate`, `npm run check`              |
| 3. Auth Spine               | Not started | Add Better Auth config, D1-backed schema, auth route, typed locals, and middleware route guards.                                  | `npm run test -- tests/auth tests/middleware`, `npm run check`, `npm run build` |
| 4. Email Layer              | Not started | Add provider-based mailer with console, Cloudflare Email, Resend, Mailgun, and Node SMTP seams; render auth emails with Backstro. | `npm run test -- tests/email`, `npm run check`                                  |
| 5. Form And API Conventions | Not started | Add Zod parsing helpers, standard JSON responses, Astro Actions patterns, and one sample mutation.                                | `npm run test -- tests/http tests/actions`, `npm run check`                     |
| 6. Minimal Auth UI          | Not started | Add Bejamas-derived form components, Lucide Astro icons, login/register/reset/verify pages, and dashboard shell.                  | `npm run check`, `npm run build`, user visual verification                      |
| 7. Operational Polish       | Not started | Add docs, example env files, D1 setup notes, first ADRs, and CI-ready scripts.                                                    | `npm run verify`, documentation review                                          |
| 8. Hyperdrive Proof         | Deferred    | Add non-runtime PostgreSQL/MySQL proof tests for the adapter seam without making Hyperdrive a supported production target yet.    | Targeted adapter tests and a documented gap list                                |

## First Milestone

Milestone 1 is complete when slices 1 through 3 are done. At that point VK should be an empty but deployable Cloudflare Workers Astro app with a real D1 database layer, Better Auth mounted, middleware locals wired, and a small portability contract that makes future Hyperdrive work tractable.

## Dependency Policy

Prefer first-party Astro, Cloudflare, Better Auth, Drizzle, Tailwind, and Vitest packages. Add helper packages only when they remove meaningful boilerplate or are required by a chosen integration. Avoid adding UI/runtime libraries that imply React, Vue, Svelte, or SPA-style app structure.

## Deferred By Design

These are useful but intentionally out of the first milestone: R2 uploads, media processing, image transforms, admin CRUD screens, CLI generation, queues/workflows, analytics, CSP policy presets, object storage adapters, full RBAC admin UI, data grids, charts, toasts, and Hyperdrive production support.
