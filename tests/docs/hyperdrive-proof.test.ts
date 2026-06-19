import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const projectRoot = new URL('../../', import.meta.url);

async function readProjectFile(path: string) {
  return readFile(new URL(path, projectRoot), 'utf8');
}

describe('Hyperdrive proof documentation contract', () => {
  it('documents schema comparison notes and portability gaps', async () => {
    const proof = await readProjectFile('docs/setup/hyperdrive-proof.md');

    expect(proof).toContain('D1 remains the only supported runtime database');
    expect(proof).toContain('SQLite');
    expect(proof).toContain('PostgreSQL');
    expect(proof).toContain('MySQL');
    expect(proof).toContain('app_settings');
    expect(proof).toContain('Portable query patterns');
    expect(proof).toContain('Dialect-specific helpers');
    expect(proof).toContain('Gap list');
    expect(proof).toContain('Hyperdrive production support is still deferred');
  });
});
