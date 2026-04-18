export function createFrameUid(value: string, maxLength = 32): string {
  const sanitized = value.replace(/[^a-z0-9_-]/gi, "").slice(0, maxLength);
  return `frame_${sanitized || "default"}`;
}
