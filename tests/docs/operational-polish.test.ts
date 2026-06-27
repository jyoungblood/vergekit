import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const projectRoot = new URL('../../', import.meta.url);

async function readProjectFile(path: string) {
  return readFile(new URL(path, projectRoot), 'utf8');
}

describe('operational polish documentation contract', () => {
  it('keeps Worker app variables in Wrangler config and local secrets in dev vars', async () => {
    const wranglerConfig = await readProjectFile('wrangler.jsonc');
    const devVarsExample = await readProjectFile('.dev.vars.example');

    expect(wranglerConfig).toContain('"vars"');
    expect(wranglerConfig).toContain('"APP_NAME": "VK"');
    expect(wranglerConfig).toContain('"DATABASE_TARGET": "d1"');
    expect(wranglerConfig).toContain('"EMAIL_PROVIDER": "console"');

    expect(devVarsExample).toContain('BETTER_AUTH_SECRET=');
    expect(devVarsExample).toContain('BETTER_AUTH_URL=');
    expect(devVarsExample).not.toContain('APP_NAME=');
    expect(devVarsExample).not.toContain('DATABASE_TARGET=');
    expect(devVarsExample).not.toContain('EMAIL_PROVIDER=');

    await expect(readProjectFile('.env.example')).rejects.toThrow();

    expect(`${wranglerConfig}\n${devVarsExample}`).not.toMatch(
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
    const readme = await readProjectFile('README.md');
    const d1Setup = await readProjectFile('docs/setup/d1.md');
    const deployment = await readProjectFile('docs/setup/deployment.md');

    expect(readme).toContain('npm run init:admin');
    expect(readme).toContain('npm run db:studio');
    expect(d1Setup).toContain('wrangler d1 create vk');
    expect(d1Setup).toContain('npm run db:generate');
    expect(d1Setup).toContain('npm run db:studio');
    expect(d1Setup).toContain('npm run db:migrate:local');
    expect(d1Setup).toContain('npm run db:migrate:remote');
    expect(d1Setup).toContain('npm run init:admin');
    expect(d1Setup).toContain('database_id');
    expect(d1Setup).toContain('Miniflare');
    expect(d1Setup).toContain('preview_database_id');
    expect(d1Setup).toContain('remote: true');
    expect(d1Setup).toContain('Chrome extension is not required');
    expect(d1Setup).toContain('drizzle.studio.local.config.ts');
    expect(d1Setup).toContain('LOCAL_D1_SQLITE_PATH');
    expect(d1Setup).toContain(
      '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/',
    );
    expect(d1Setup).toContain('metadata.sqlite');

    expect(deployment).toContain('npm run init:admin -- --remote');
    expect(deployment).toContain('npm run verify');
    expect(deployment).toContain('wrangler secret put BETTER_AUTH_SECRET');
    expect(deployment).toContain('wrangler secret put RESEND_API_KEY');
    expect(deployment).toContain('wrangler secret put MAILGUN_API_KEY');
    expect(deployment).toContain('wrangler.jsonc');
    expect(deployment).toContain('npm run build');
  });

  it('keeps the verify script suitable for CI', async () => {
    const packageJson = JSON.parse(await readProjectFile('package.json')) as {
      scripts?: Record<string, string>;
    };

    expect(packageJson.scripts?.verify).toBe(
      'npm run check && npm run lint && npm run test && npm run build',
    );
    expect(packageJson.scripts?.['db:studio']).toBe('drizzle-kit studio');
    expect(packageJson.scripts).not.toHaveProperty('db:studio:remote');
    expect(packageJson.scripts).not.toHaveProperty('db:studio:local');
    expect(packageJson.scripts?.['init:admin']).toBe('tsx cli/init-admin.ts');
  });
});
