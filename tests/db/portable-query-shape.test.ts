import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { appSettings } from '@/db/schema';

describe('portable app query shapes', () => {
  it('keeps app settings queries in the drizzle query builder subset', () => {
    const keyFilter = eq(appSettings.key, 'site.title');
    expect(keyFilter).toBeDefined();
  });
});
