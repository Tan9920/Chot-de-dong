function roleOf(user: any) {
  return String(user?.role || 'guest');
}

function permissionsOf(user: any) {
  return Array.isArray(user?.permissions) ? user.permissions.map((item: any) => String(item)) : [];
}

function hasWildcardPermission(user: any) {
  return permissionsOf(user).includes('*');
}

function hasExplicitPermission(user: any, permission = '') {
  const perms = permissionsOf(user);
  return perms.includes(permission) || perms.includes(permission.split(':')[0] + ':*');
}

function sameSchool(user: any, lesson: any) {
  return Boolean(user?.schoolKey && lesson?.schoolKey && user.schoolKey === lesson.schoolKey);
}

function sameDepartment(user: any, lesson: any) {
  return sameSchool(user, lesson) && Boolean(user?.departmentKey && lesson?.departmentKey && user.departmentKey === lesson.departmentKey);
}

function isOwner(user: any, lesson: any) {
  return Boolean(user?.id && lesson?.authorId && user.id === lesson.authorId);
}

function isPrivilegedReviewer(user: any, lesson: any) {
  const role = roleOf(user);
  if (role === 'admin') return true;
  if (role === 'leader') return sameDepartment(user, lesson) || sameSchool(user, lesson);
  return false;
}

function assertGlobalRolePermission(user: any, permission = 'lesson:read') {
  const role = roleOf(user);
  const action = String(permission || 'lesson:read');
  if (!user) return false;
  if (role === 'admin' || hasWildcardPermission(user) || hasExplicitPermission(user, action)) return true;

  // Batch96: content/admin actions do not always have a lesson object. Older code
  // accidentally denied legitimate leader/reviewer flows because it returned false
  // before checking the permission namespace. Keep membership/admin-only operations
  // narrow, but allow leader-level chuyên môn governance where intended.
  if (action.startsWith('membership:')) return false;
  if (action.startsWith('content:')) return role === 'leader';
  if (action.startsWith('lesson:review') || action.startsWith('lesson:approve')) return role === 'leader';
  if (action.startsWith('lesson:manage') || action.startsWith('lesson:update') || action.startsWith('lesson:delete')) return false;
  if (action.startsWith('lesson:read') || action.startsWith('lesson:export')) return role === 'teacher' || role === 'leader';
  return false;
}

export function assertLessonPermission(user: any, permission = 'lesson:read', lesson?: any) {
  if (!user) return false;
  if (!lesson) return assertGlobalRolePermission(user, permission);
  if (roleOf(user) === 'admin' || hasWildcardPermission(user) || hasExplicitPermission(user, permission)) return true;

  const visibility = lesson.visibilityScope || 'private';
  const owner = isOwner(user, lesson);
  const reviewer = isPrivilegedReviewer(user, lesson);
  const action = String(permission || 'lesson:read');

  if (action.includes('read') || action.includes('export')) {
    if (owner || reviewer) return true;
    if (visibility === 'school') return sameSchool(user, lesson);
    if (visibility === 'department') return sameDepartment(user, lesson);
    return false;
  }

  if (action.includes('review') || action.includes('approve')) {
    return reviewer;
  }

  if (action.includes('delete') || action.includes('update') || action.includes('manage') || action.includes('write')) {
    return owner || reviewer;
  }

  return owner;
}
