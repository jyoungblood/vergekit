import { createAuthClient } from 'better-auth/client';
import { adminClient } from 'better-auth/client/plugins';
import { accessControl, authRoles } from '@/auth/permissions';

export const authClient = createAuthClient({
  plugins: [
    adminClient({
      ac: accessControl,
      roles: authRoles,
    }),
  ],
});
