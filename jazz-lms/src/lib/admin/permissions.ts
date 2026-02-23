export const ADMIN_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  COURSE_ADMIN: 'COURSE_ADMIN',
  CONTENT_CREATOR: 'CONTENT_CREATOR',
  MODERATOR: 'MODERATOR',
} as const;

export type AdminRole = (typeof ADMIN_ROLES)[keyof typeof ADMIN_ROLES];

export type Permission =
  | 'admin.access'
  | 'courses.read'
  | 'courses.create'
  | 'courses.update'
  | 'courses.delete'
  | 'users.read'
  | 'users.update'
  | 'users.assign_role'
  | 'analytics.read'
  | 'settings.read'
  | 'settings.update';

const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  [ADMIN_ROLES.SUPER_ADMIN]: [
    'admin.access',
    'courses.read',
    'courses.create',
    'courses.update',
    'courses.delete',
    'users.read',
    'users.update',
    'users.assign_role',
    'analytics.read',
    'settings.read',
    'settings.update',
  ],
  [ADMIN_ROLES.COURSE_ADMIN]: [
    'admin.access',
    'courses.read',
    'courses.create',
    'courses.update',
    'courses.delete',
    'analytics.read',
  ],
  [ADMIN_ROLES.CONTENT_CREATOR]: [
    'admin.access',
    'courses.read',
    'courses.create',
    'courses.update',
  ],
  [ADMIN_ROLES.MODERATOR]: [
    'admin.access',
    'courses.read',
    'users.read',
  ],
};

export function isAdminRole(role?: string | null): role is AdminRole {
  if (!role) return false;
  return Object.values(ADMIN_ROLES).includes(role as AdminRole);
}

export function hasPermission(role: string | null | undefined, permission: Permission): boolean {
  if (!isAdminRole(role)) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
}
