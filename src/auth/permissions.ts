import type { User } from 'better-auth';
import { createAccessControl } from 'better-auth/plugins/access';
import {
  adminAc,
  defaultStatements,
} from 'better-auth/plugins/admin/access';

export const APP_ROLES = ['admin', 'moderator', 'user', 'banned'] as const;
export type AppRole = (typeof APP_ROLES)[number];

export const DEFAULT_APP_ROLE = 'user' satisfies AppRole;
export const ADMIN_APP_ROLES = ['admin'] as const satisfies AppRole[];

export interface AppUserFields {
  role?: string | null;
  banned?: boolean | null;
  banReason?: string | null;
  banExpires?: Date | null;
}

export type AppUser = User & AppUserFields;

export const accessStatements = {
  ...defaultStatements,
  app: ['access', 'moderate', 'administer'],
} as const;

export const accessControl = createAccessControl(accessStatements);

const emptyAdminPermissions = {
  user: [],
  session: [],
} as const;

export const adminRole = accessControl.newRole({
  ...adminAc.statements,
  app: ['access', 'moderate', 'administer'],
});

export const moderatorRole = accessControl.newRole({
  ...emptyAdminPermissions,
  app: ['access', 'moderate'],
});

export const userRole = accessControl.newRole({
  ...emptyAdminPermissions,
  app: ['access'],
});

export const bannedRole = accessControl.newRole({
  ...emptyAdminPermissions,
  app: [],
});

export const authRoles = {
  admin: adminRole,
  moderator: moderatorRole,
  user: userRole,
  banned: bannedRole,
} as const;

export type AppPermissionRequest = Parameters<typeof adminRole.authorize>[0];

export function isAppRole(value: string): value is AppRole {
  return APP_ROLES.includes(value as AppRole);
}

export function getAppRolesForUser(
  user: AppUserFields | null | undefined,
): AppRole[] {
  const storedRole = user?.role?.trim() || DEFAULT_APP_ROLE;
  const roles = storedRole
    .split(',')
    .map((role) => role.trim())
    .filter(isAppRole);

  return roles.length ? roles : [DEFAULT_APP_ROLE];
}

export function isAppBannedUser(user: AppUserFields | null | undefined) {
  return Boolean(user?.banned) || getAppRolesForUser(user).includes('banned');
}

export function userHasAppPermission(
  user: AppUserFields | null | undefined,
  permissions: AppPermissionRequest,
) {
  if (!user || isAppBannedUser(user)) {
    return false;
  }

  return getAppRolesForUser(user).some((role) => {
    return authRoles[role].authorize(permissions).success;
  });
}
