# Hyperdrive Proof

D1 remains the only supported runtime database. This slice proves the `src/db`
boundary can host future Hyperdrive-backed PostgreSQL and MySQL adapters without
promoting either target to production support.

The proof modules under `src/db/hyperdrive` are imported by tests only. Runtime
code should continue to create databases through the D1 path and should continue
to reject `DATABASE_TARGET=pg` and `DATABASE_TARGET=mysql`.

## Schema Comparison

| Table          | SQLite D1                               | PostgreSQL Hyperdrive proof           | MySQL Hyperdrive proof                 |
| -------------- | --------------------------------------- | ------------------------------------- | -------------------------------------- |
| `app_settings` | `text` key, `text` value, integer dates | `text` key, `text` value, timestamptz | `varchar(128)` key, `text`, timestamps |

The D1 schema stores app-owned dates as integer timestamp values because that is
the existing SQLite contract. The PostgreSQL and MySQL proof schemas use native
timestamp columns because those dialects have first-class timestamp support. Any
future migration from proof to runtime support must define the serialization
boundary for these date values before writes are enabled.

## Portable query patterns

- Prefer Drizzle query-builder reads using `select`, `from`, `where`, and
  parameterized predicates such as `eq`.
- Keep app query call sites behind local helpers such as
  `selectAppSettingByKey`, so target factories can compile the same logical
  query for SQLite, PostgreSQL, or MySQL.
- Keep deterministic read queries separate from mutations. Hyperdrive can cache
  read queries, while writes must remain explicit and consistency-aware.

## Dialect-specific helpers

Dialect-specific helpers are required before using:

- Upserts, because SQLite `onConflictDoUpdate`, PostgreSQL `on conflict`, and
  MySQL `on duplicate key update` have different Drizzle APIs.
- Date/time expressions, because SQLite integer timestamps differ from native
  PostgreSQL and MySQL timestamp columns.
- Raw SQL fragments, full-text search, JSON operators, generated columns, and
  database-specific indexes.
- MySQL connection-field usage, because MySQL drivers may use Hyperdrive `host`,
  `port`, `user`, `password`, and `database` fields instead of only a connection
  string.

## Gap list

- Hyperdrive production support is still deferred.
- `DATABASE_TARGET=pg` and `DATABASE_TARGET=mysql` still throw at runtime.
- No PostgreSQL or MySQL migrations are generated.
- No real Hyperdrive binding is configured in `wrangler.jsonc`.
- No PostgreSQL or MySQL driver dependency is required by this proof.
- Writes remain D1-only until upsert and timestamp semantics are specified per
  dialect.
