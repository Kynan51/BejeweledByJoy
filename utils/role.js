// utils/role.js
// Utility functions for client-side role access

export function getUserRole(currentEmail) {
  if (typeof window === 'undefined') return null;
  try {
    const cache = JSON.parse(localStorage.getItem('userRoleCache'));
    if (cache && cache.email && cache.role && cache.email === currentEmail) {
      return cache.role;
    }
    return null;
  } catch {
    return null;
  }
}

export function isAdminRole(currentEmail) {
  const role = getUserRole(currentEmail);
  return role === 'admin' || role === 'owner';
}

export function isOwnerRole(currentEmail) {
  const role = getUserRole(currentEmail);
  return role === 'owner';
}

export function getUserEmail() {
  if (typeof window === 'undefined') return null;
  try {
    const cache = JSON.parse(localStorage.getItem('userRoleCache'));
    return cache?.email || null;
  } catch {
    return null;
  }
}
