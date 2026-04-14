/** Returns admin emails from the environment, or an empty list when unset. */
export function getAdminEmails(): string[] {
  const env = (import.meta.env.VITE_ADMIN_EMAILS ?? "").trim();
  if (!env) return [];
  return env
    .split(",")
    .map((e: string) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** Returns true when the given email belongs to an admin account. */
export function isAdminEmail(email: string): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}
