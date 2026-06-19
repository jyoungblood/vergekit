import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { createD1Database } from '@/db/client';
import { appSettings } from '@/db/schema';

describe('createD1Database', () => {
  it('creates a D1 drizzle client with the app schema query surface', () => {
    const db = createD1Database({} as Parameters<typeof createD1Database>[0]);

    const query = db
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, 'site.title'))
      .toSQL();

    expect(query.sql).toContain('app_settings');
    expect(query.params).toEqual(['site.title']);
  });
});
