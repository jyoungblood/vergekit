import { eq, getTableName } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { createD1Database } from '@/db/client';
import { account, session, user, verification } from '@/db/schema';

describe('Better Auth D1 schema', () => {
  it('exposes the core Better Auth table names expected by the Drizzle adapter', () => {
    expect(getTableName(user)).toBe('user');
    expect(getTableName(session)).toBe('session');
    expect(getTableName(account)).toBe('account');
    expect(getTableName(verification)).toBe('verification');
  });

  it('keeps auth queries on the shared D1 drizzle client surface', () => {
    const db = createD1Database({} as Parameters<typeof createD1Database>[0]);

    const query = db
      .select()
      .from(user)
      .where(eq(user.email, 'user@example.com'))
      .toSQL();

    expect(query.sql).toContain('from "user"');
    expect(query.params).toEqual(['user@example.com']);
  });
});
