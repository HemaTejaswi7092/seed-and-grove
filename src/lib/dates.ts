// Whole days since an ISO timestamp, counting the creation day itself as
// day 1 — so a Seed planted moments ago reads "1 day building," not "0."
export function daysSince(iso: string): number {
  const created = new Date(iso).getTime();
  if (Number.isNaN(created)) return 1;
  const elapsedDays = Math.floor((Date.now() - created) / 86_400_000);
  return Math.max(1, elapsedDays + 1);
}

// Short relative-time label for real, timestamped Seed records (evidence,
// activity) — distinct from the demo data's hand-written strings.
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const minutes = Math.floor((Date.now() - then) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString();
}
