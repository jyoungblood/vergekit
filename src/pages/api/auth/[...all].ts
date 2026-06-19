import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { createAuthFromEnv } from '@/auth/server';

export const ALL: APIRoute = async ({ request }) => {
  return createAuthFromEnv(env, request).handler(request);
};
