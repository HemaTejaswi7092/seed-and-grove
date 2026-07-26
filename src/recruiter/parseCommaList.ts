// Shared by the recruiter signup wizard and profile editor — both use a
// plain comma-separated text input for hiring_locations/hiring_roles
// (text[] columns) rather than a tag-input component.
export function parseCommaList(text: string): string[] {
  return text
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
