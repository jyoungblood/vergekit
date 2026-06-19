import { describe, expect, it } from 'vitest';
import {
  createD1AppSettingsQueryTarget,
  type AppSettingsQueryTarget,
} from '@/db/client';
import { createPostgresHyperdriveProofTarget } from '@/db/hyperdrive/pg';
import { createMySqlHyperdriveProofTarget } from '@/db/hyperdrive/mysql';
import { selectAppSettingByKey } from '@/db/queries/app-settings';
import { parseDatabaseTarget } from '@/db/target';

function normalizeSql(sql: string) {
  return sql.replace(/\s+/g, ' ').toLowerCase();
}

function inertSocket() {
  throw new Error('Hyperdrive proof tests must not open sockets');
}

describe('Hyperdrive adapter proof', () => {
  it('uses the same app settings query helper against D1, PostgreSQL, and MySQL proof targets', () => {
    const targets: AppSettingsQueryTarget[] = [
      createD1AppSettingsQueryTarget({} as D1Database),
      createPostgresHyperdriveProofTarget({
        connectionString: 'postgres://vk:secret@hyperdrive.local:5432/vk',
        connect: inertSocket,
      } as unknown as Hyperdrive),
      createMySqlHyperdriveProofTarget({
        connectionString: 'mysql://vk:secret@hyperdrive.local:3306/vk',
        host: 'hyperdrive.local',
        port: 3306,
        user: 'vk',
        password: 'secret',
        database: 'vk',
        connect: inertSocket,
      } as unknown as Hyperdrive),
    ];

    for (const target of targets) {
      const compiled = selectAppSettingByKey(target, 'site.title');
      const sql = normalizeSql(compiled.sql);

      expect(target.target).toMatch(/^(d1|pg|mysql)$/);
      expect(sql).toContain('select');
      expect(sql).toContain('app_settings');
      expect(sql).toContain('where');
      expect(compiled.params).toEqual(['site.title']);
    }
  });

  it('keeps PostgreSQL and MySQL rejected as runtime targets while proof factories exist', () => {
    expect(() => parseDatabaseTarget('pg')).toThrow(
      'Database target pg is not implemented',
    );
    expect(() => parseDatabaseTarget('mysql')).toThrow(
      'Database target mysql is not implemented',
    );
  });

  it('validates Hyperdrive binding shapes before compiling proof queries', () => {
    expect(() =>
      createPostgresHyperdriveProofTarget({
        connectionString: 'mysql://vk:secret@hyperdrive.local:3306/vk',
        connect: inertSocket,
      } as unknown as Hyperdrive),
    ).toThrow(
      'PostgreSQL Hyperdrive proof requires a postgres connection string',
    );

    expect(() =>
      createMySqlHyperdriveProofTarget({
        connectionString: 'mysql://vk:secret@hyperdrive.local:3306/vk',
        host: '',
        port: 3306,
        user: 'vk',
        password: 'secret',
        database: 'vk',
        connect: inertSocket,
      } as unknown as Hyperdrive),
    ).toThrow(
      'MySQL Hyperdrive proof requires host, port, user, password, and database',
    );
  });
});
