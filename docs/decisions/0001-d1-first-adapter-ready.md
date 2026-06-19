# 0001. D1-First, Adapter-Ready Database Architecture

Date: 2026-06-19

Status: Accepted

## Context

VK targets Cloudflare Workers first, so the runtime database needs to work without
a TCP connection, Node-only drivers, or a separate server. Cloudflare D1 is the
initial supported database because it is available directly as a Workers binding
and maps cleanly to Drizzle's SQLite dialect.

The project still needs a path to PostgreSQL or MySQL later. Cloudflare Hyperdrive
is a planned adapter target, but it is not initial runtime support for this
boilerplate. Adding it now would make the first milestone carry multiple
database operational models before the app has a real need for them.

## Decision

VK is D1-first at runtime. Application code imports database behavior through the
local `src/db` surface, not from `drizzle-orm/d1` directly. Schema and query code
must stay inside a conservative Drizzle query-builder subset unless a
dialect-specific helper is introduced with a documented portability boundary.

Hyperdrive remains a planned adapter target. A later proof slice can add
PostgreSQL and MySQL tests around the adapter seam without making either driver a
supported production runtime.

## Consequences

- The first deployable app has one database binding: `DB`.
- Local setup can use Wrangler's local D1 state and the same migrations directory
  as remote D1.
- Runtime code remains simple while preserving an explicit place for future
  adapters.
- Future Hyperdrive work must prove query portability before being promoted from
  proof target to supported runtime path.
