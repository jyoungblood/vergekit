import { env } from 'cloudflare:workers';
import { defineMiddleware } from 'astro:middleware';
import { createAuthFromEnv } from '@/auth/server';
import { resolveRouteAccess } from '@/auth/routes';

export const onRequest = defineMiddleware(async (context, next) => {
  const auth = createAuthFromEnv(env, context.request);
  const session = await auth.api.getSession({
    headers: context.request.headers,
  });

  context.locals.user = session?.user ?? null;
  context.locals.session = session?.session ?? null;
  context.locals.isAuthenticated = Boolean(session);

  const requestURL = new URL(context.request.url);
  const routePath = `${requestURL.pathname}${requestURL.search}`;
  const access = resolveRouteAccess(routePath, {
    isAuthenticated: context.locals.isAuthenticated,
    user: context.locals.user,
  });

  if (access.type === 'allow') {
    return next();
  }

  if (access.type === 'forbidden') {
    return new Response('Forbidden', { status: 403 });
  }

  return context.redirect(access.location);
});
