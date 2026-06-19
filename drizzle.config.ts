import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  driver: 'd1-http',
  schema: './src/db/schema/index.ts',
  out: './drizzle/d1',
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID ?? 'local',
    databaseId: process.env.CLOUDFLARE_DATABASE_ID ?? 'local',
    token: process.env.CLOUDFLARE_D1_TOKEN ?? 'local',
  },
});
