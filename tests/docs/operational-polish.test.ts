import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const projectRoot = new URL('../../', import.meta.url);

async function readProjectFile(path: string) {
  return readFile(new URL(path, projectRoot), 'utf8');
}

describe('operational polish documentation contract', () => {
  it('documents local and CI environment variables without real secrets', async () => {
    const envExample = await readProjectFile('.env.example');
    const devVarsExample = await readProjectFile('.dev.vars.example');

    expect(envExample).toContain('CLOUDFLARE_ACCOUNT_ID=');
    expect(envExample).toContain('CLOUDFLARE_DATABASE_ID=');
    expect(envExample).toContain('CLOUDFLARE_D1_TOKEN=');
    expect(envExample).toContain('DATABASE_TARGET=d1');

    expect(devVarsExample).toContain('APP_NAME=VK');
    expect(devVarsExample).toContain('DATABASE_TARGET=d1');
    expect(devVarsExample).toContain('EMAIL_PROVIDER=console');
    expect(devVarsExample).toContain('BETTER_AUTH_SECRET=');
    expect(devVarsExample).toContain('BETTER_AUTH_URL=');

    expect(`${envExample}\n${devVarsExample}`).not.toMatch(
      /(sk-[a-z0-9]|-----BEGIN|real-secret|changeme)/i,
    );
  });

  it('captures the first architecture decisions', async () => {
    const d1Decision = await readProjectFile(
      'docs/decisions/0001-d1-first-adapter-ready.md',
    );
    const emailDecision = await readProjectFile(
      'docs/decisions/0002-workers-email-provider-strategy.md',
    );

    expect(d1Decision).toContain('D1-first');
    expect(d1Decision).toContain('Hyperdrive');
    expect(d1Decision).toContain('planned adapter target');
    expect(d1Decision).toContain('src/db');

    expect(emailDecision).toContain('EMAIL_PROVIDER');
    expect(emailDecision).toContain('console');
    expect(emailDecision).toContain('Cloudflare Email');
    expect(emailDecision).toContain('Wrangler secrets');
  });

  it('documents D1 setup and deployment workflows', async () => {
    const d1Setup = await readProjectFile('docs/setup/d1.md');
    const deployment = await readProjectFile('docs/setup/deployment.md');

    expect(d1Setup).toContain('wrangler d1 create vk');
    expect(d1Setup).toContain('npm run db:generate');
    expect(d1Setup).toContain('npm run db:migrate:local');
    expect(d1Setup).toContain('npm run db:migrate:remote');
    expect(d1Setup).toContain('database_id');

    expect(deployment).toContain('npm run verify');
    expect(deployment).toContain('wrangler secret put BETTER_AUTH_SECRET');
    expect(deployment).toContain('wrangler secret put');
    expect(deployment).toContain('npm run build');
  });

  it('keeps the verify script suitable for CI', async () => {
    const packageJson = JSON.parse(await readProjectFile('package.json')) as {
      scripts?: Record<string, string>;
    };

    expect(packageJson.scripts?.verify).toBe(
      'npm run check && npm run lint && npm run format:check && npm run test && npm run build',
    );
  });
});
