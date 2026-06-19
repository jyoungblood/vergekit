import { eq } from 'drizzle-orm';
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/pg-proxy';
import type { AppSettingsQueryTarget } from '../queries/app-settings';

const pgAppSettings = pgTable('app_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

const pgSchema = {
  appSettings: pgAppSettings,
};

function assertPostgresHyperdrive(binding: Hyperdrive) {
  if (!/^postgres(?:ql)?:\/\//.test(binding.connectionString)) {
    throw new Error(
      'PostgreSQL Hyperdrive proof requires a postgres connection string',
    );
  }
}

export function createPostgresHyperdriveProofTarget(
  binding: Hyperdrive,
): AppSettingsQueryTarget {
  assertPostgresHyperdrive(binding);

  const db = drizzle(async () => ({ rows: [] }), { schema: pgSchema });

  return {
    target: 'pg',
    selectAppSettingByKey(key) {
      return db
        .select()
        .from(pgAppSettings)
        .where(eq(pgAppSettings.key, key))
        .toSQL();
    },
  };
}
