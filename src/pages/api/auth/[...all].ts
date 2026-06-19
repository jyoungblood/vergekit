import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import {
  createSignOutAuthRequest,
  resolveSignOutRedirectPath,
  shouldRedirectSignOutRequest,
} from '@/auth/routes';
import { createAuthFromEnv } from '@/auth/server';

export const ALL: APIRoute = async ({ request }) => {
  const shouldRedirectSignOut = shouldRedirectSignOutRequest(request);
  const authRequest = createSignOutAuthRequest(request);
  const authResponse = await createAuthFromEnv(env, authRequest).handler(
    authRequest,
  );

  if (!authResponse.ok || !shouldRedirectSignOut) {
    return authResponse;
  }

  const headers = new Headers(authResponse.headers);
  headers.delete('content-length');
  headers.delete('content-type');
  headers.delete('set-cookie');

  for (const cookie of authResponse.headers.getSetCookie()) {
    headers.append('set-cookie', cookie);
  }

  headers.set('location', await resolveSignOutRedirectPath(request));

  return new Response(null, {
    status: 303,
    headers,
  });
};
