import { describe, expect, test } from 'vitest';
import {
  ADMIN_ROLES,
  isAdminRole,
  hasPermission,
} from '@/lib/admin/permissions';
import type { Permission } from '@/lib/admin/permissions';

describe('ADMIN_ROLES', () => {
  test('contains all expected roles', () => {
    expect(ADMIN_ROLES.SUPER_ADMIN).toBe('SUPER_ADMIN');
    expect(ADMIN_ROLES.COURSE_ADMIN).toBe('COURSE_ADMIN');
    expect(ADMIN_ROLES.CONTENT_CREATOR).toBe('CONTENT_CREATOR');
    expect(ADMIN_ROLES.MODERATOR).toBe('MODERATOR');
    expect(Object.keys(ADMIN_ROLES)).toHaveLength(4);
  });
});

describe('isAdminRole', () => {
  test('returns true for valid admin roles', () => {
    expect(isAdminRole('SUPER_ADMIN')).toBe(true);
    expect(isAdminRole('COURSE_ADMIN')).toBe(true);
    expect(isAdminRole('CONTENT_CREATOR')).toBe(true);
    expect(isAdminRole('MODERATOR')).toBe(true);
  });

  test('returns false for null/undefined', () => {
    expect(isAdminRole(null)).toBe(false);
    expect(isAdminRole(undefined)).toBe(false);
  });

  test('returns false for non-admin roles', () => {
    expect(isAdminRole('USER')).toBe(false);
    expect(isAdminRole('ADMIN')).toBe(false);
    expect(isAdminRole('')).toBe(false);
    expect(isAdminRole('random')).toBe(false);
  });
});

describe('hasPermission', () => {
  test('SUPER_ADMIN has all permissions', () => {
    const allPermissions: Permission[] = [
      'admin.access', 'courses.read', 'courses.create', 'courses.update',
      'courses.delete', 'users.read', 'users.update', 'users.assign_role',
      'analytics.read', 'settings.read', 'settings.update',
    ];
    for (const perm of allPermissions) {
      expect(hasPermission('SUPER_ADMIN', perm)).toBe(true);
    }
  });

  test('COURSE_ADMIN has course and analytics permissions', () => {
    expect(hasPermission('COURSE_ADMIN', 'admin.access')).toBe(true);
    expect(hasPermission('COURSE_ADMIN', 'courses.read')).toBe(true);
    expect(hasPermission('COURSE_ADMIN', 'courses.create')).toBe(true);
    expect(hasPermission('COURSE_ADMIN', 'courses.update')).toBe(true);
    expect(hasPermission('COURSE_ADMIN', 'courses.delete')).toBe(true);
    expect(hasPermission('COURSE_ADMIN', 'analytics.read')).toBe(true);
  });

  test('COURSE_ADMIN does NOT have user/settings permissions', () => {
    expect(hasPermission('COURSE_ADMIN', 'users.read')).toBe(false);
    expect(hasPermission('COURSE_ADMIN', 'users.update')).toBe(false);
    expect(hasPermission('COURSE_ADMIN', 'users.assign_role')).toBe(false);
    expect(hasPermission('COURSE_ADMIN', 'settings.read')).toBe(false);
    expect(hasPermission('COURSE_ADMIN', 'settings.update')).toBe(false);
  });

  test('CONTENT_CREATOR has limited course permissions', () => {
    expect(hasPermission('CONTENT_CREATOR', 'admin.access')).toBe(true);
    expect(hasPermission('CONTENT_CREATOR', 'courses.read')).toBe(true);
    expect(hasPermission('CONTENT_CREATOR', 'courses.create')).toBe(true);
    expect(hasPermission('CONTENT_CREATOR', 'courses.update')).toBe(true);
    expect(hasPermission('CONTENT_CREATOR', 'courses.delete')).toBe(false);
    expect(hasPermission('CONTENT_CREATOR', 'analytics.read')).toBe(false);
  });

  test('MODERATOR has read-only permissions', () => {
    expect(hasPermission('MODERATOR', 'admin.access')).toBe(true);
    expect(hasPermission('MODERATOR', 'courses.read')).toBe(true);
    expect(hasPermission('MODERATOR', 'users.read')).toBe(true);
    expect(hasPermission('MODERATOR', 'courses.create')).toBe(false);
    expect(hasPermission('MODERATOR', 'courses.update')).toBe(false);
    expect(hasPermission('MODERATOR', 'users.update')).toBe(false);
  });

  test('returns false for non-admin roles', () => {
    expect(hasPermission('USER', 'admin.access')).toBe(false);
    expect(hasPermission(null, 'admin.access')).toBe(false);
    expect(hasPermission(undefined, 'admin.access')).toBe(false);
    expect(hasPermission('', 'admin.access')).toBe(false);
  });
});
