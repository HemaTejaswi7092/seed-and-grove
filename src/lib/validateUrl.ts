// Empty is always valid (every URL field in Profile is optional) — only
// a non-empty value has to actually parse as an http(s) URL, so a
// candidate can't save something like "linkedin.com/in/x" (no protocol,
// wouldn't work as an href) that would silently render as a dead link.
export function isValidUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
