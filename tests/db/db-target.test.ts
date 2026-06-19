import { describe, expect, it } from 'vitest';
import { parseDatabaseTarget } from '@/db/target';

describe('parseDatabaseTarget', () => {
  it('accepts d1 as the only implemented target', () => {
    expect(parseDatabaseTarget('d1')).toBe('d1');
  });

  it('rejects future targets until their adapters are implemented', () => {
    expect(() => parseDatabaseTarget('pg')).toThrow(
      'Database target pg is not implemented',
    );
    expect(() => parseDatabaseTarget('mysql')).toThrow(
      'Database target mysql is not implemented',
    );
  });
});
