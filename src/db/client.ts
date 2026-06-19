import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import type { AppSettingsQueryTarget } from './queries/app-settings';
import { appSettings } from './schema';
import * as schema from './schema';

export type { AppSettingsQueryTarget } from './queries/app-settings';

export type AppDatabase = ReturnType<typeof createD1Database>;

export function createD1Database(binding: D1Database) {
  return drizzle(binding, { schema });
}

export function createD1AppSettingsQueryTarget(
  binding: D1Database,
): AppSettingsQueryTarget {
  const db = createD1Database(binding);

  return {
    target: 'd1',
    selectAppSettingByKey(key) {
      return db
        .select()
        .from(appSettings)
        .where(eq(appSettings.key, key))
        .toSQL();
    },
  };
}
