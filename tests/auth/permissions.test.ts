import { describe, expect, it } from 'vitest';
import {
  ADMIN_APP_ROLES,
  APP_ROLES,
  DEFAULT_APP_ROLE,
  getAppRolesForUser,
  isAppBannedUser,
  userHasAppPermission,
} from '@/auth/permissions';

describe('app auth permissions', () => {
  it('ships the starter roles expected by the boilerplate', () => {
    expect(APP_ROLES).toEqual(['admin', 'moderator', 'user', 'banned']);
    expect(DEFAULT_APP_ROLE).toBe('user');
    expect(ADMIN_APP_ROLES).toEqual(['admin']);
  });

  it('normalizes stored Better Auth role strings', () => {
    expect(getAppRolesForUser({ role: 'admin,moderator' })).toEqual([
      'admin',
      'moderator',
    ]);
    expect(getAppRolesForUser({ role: 'unknown' })).toEqual(['user']);
    expect(getAppRolesForUser({})).toEqual(['user']);
  });

  it('grants app permissions by role without giving moderators admin user powers', () => {
    expect(
      userHasAppPermission({ role: 'admin' }, { app: ['administer'] }),
    ).toBe(true);
    expect(
      userHasAppPermission({ role: 'moderator' }, { app: ['moderate'] }),
    ).toBe(true);
    expect(
      userHasAppPermission({ role: 'moderator' }, { user: ['list'] }),
    ).toBe(false);
    expect(userHasAppPermission({ role: 'user' }, { app: ['access'] })).toBe(
      true,
    );
  });

  it('treats Better Auth bans and the banned role as no-access states', () => {
    expect(isAppBannedUser({ role: 'banned' })).toBe(true);
    expect(isAppBannedUser({ role: 'user', banned: true })).toBe(true);
    expect(
      userHasAppPermission({ role: 'banned' }, { app: ['access'] }),
    ).toBe(false);
    expect(
      userHasAppPermission({ role: 'admin', banned: true }, {
        app: ['administer'],
      }),
    ).toBe(false);
  });
});
