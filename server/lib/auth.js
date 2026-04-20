export function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function getConfiguredAdminEmails(envValue) {
  return String(envValue ?? '')
    .split(',')
    .map((email) => normalizeEmail(email))
    .filter(Boolean);
}

export function shouldGrantAdminAccess(email, adminEmails) {
  const normalizedEmail = normalizeEmail(email);
  return Boolean(normalizedEmail) && adminEmails.includes(normalizedEmail);
}

export function isStrongPassword(password) {
  if (typeof password !== 'string' || password.length < 12) return false;
  return /[a-z]/.test(password)
    && /[A-Z]/.test(password)
    && /\d/.test(password)
    && /[^A-Za-z0-9]/.test(password);
}

export function buildUserDisplayName({ email = '', displayName = '' } = {}) {
  const trimmedDisplayName = typeof displayName === 'string' ? displayName.trim() : '';
  if (trimmedDisplayName) return trimmedDisplayName;
  const trimmedEmail = typeof email === 'string' ? email.trim() : '';
  if (!trimmedEmail) return 'Skater';
  return trimmedEmail.split('@')[0] || 'Skater';
}
