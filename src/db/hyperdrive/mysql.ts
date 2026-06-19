import { eq } from 'drizzle-orm';
import { mysqlTable, text, timestamp, varchar } from 'drizzle-orm/mysql-core';
import { drizzle } from 'drizzle-orm/mysql-proxy';
import type { AppSettingsQueryTarget } from '../queries/app-settings';

const mysqlAppSettings = mysqlTable('app_settings', {
  key: varchar('key', { length: 128 }).primaryKey(),
  value: text('value').notNull(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

const mysqlSchema = {
  appSettings: mysqlAppSettings,
};

function assertMySqlHyperdrive(binding: Hyperdrive) {
  const hasConnectionString = binding.connectionString.startsWith('mysql://');
  const hasConnectionFields =
    binding.host.length > 0 &&
    Number.isInteger(binding.port) &&
    binding.port > 0 &&
    binding.user.length > 0 &&
    binding.password.length > 0 &&
    binding.database.length > 0;

  if (!hasConnectionString || !hasConnectionFields) {
    throw new Error(
      'MySQL Hyperdrive proof requires host, port, user, password, and database',
    );
  }
}

export function createMySqlHyperdriveProofTarget(
  binding: Hyperdrive,
): AppSettingsQueryTarget {
  assertMySqlHyperdrive(binding);

  const db = drizzle(async () => ({ rows: [] }), { schema: mysqlSchema });

  return {
    target: 'mysql',
    selectAppSettingByKey(key) {
      return db
        .select()
        .from(mysqlAppSettings)
        .where(eq(mysqlAppSettings.key, key))
        .toSQL();
    },
  };
}
