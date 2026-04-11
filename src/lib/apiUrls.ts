const IMAGE_API_URL = (import.meta.env.VITE_IMAGE_API_URL as string | undefined)?.trim();

function isAbsoluteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

export function resolveApiUrl(
  configuredUrl: string | undefined,
  fallbackPath: string,
): string {
  const trimmedConfiguredUrl = configuredUrl?.trim();
  if (trimmedConfiguredUrl) return trimmedConfiguredUrl;

  if (IMAGE_API_URL && isAbsoluteUrl(IMAGE_API_URL)) {
    try {
      return new URL(fallbackPath, IMAGE_API_URL).toString();
    } catch {
      // Fall through to the local relative path.
    }
  }

  return fallbackPath;
}
