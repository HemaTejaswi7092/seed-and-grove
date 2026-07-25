/**
 * PROTOTYPE-ONLY CONFIGURATION.
 *
 * Seed & Grove ships one seeded demo project (VISIQ) as example content.
 * We only want it to appear for the one account it was written about —
 * every other real, authenticated user should see their own empty state
 * or their own planted Seeds instead.
 *
 * Since projects aren't in the backend yet (see mockData.ts), there's no
 * real per-user project data to key off of, so — for this prototype only —
 * we identify "the demo account" by a single hardcoded email address,
 * centralized here rather than scattered across components. Sign up with
 * this exact email in Supabase to see the VISIQ demo experience.
 *
 * The demo Seed's id is likewise fixed and centralized here. Both checks
 * — isDemoAccount AND isDemoSeed — must pass before any VISIQ content is
 * ever shown; neither one alone is sufficient. This is what stops VISIQ
 * from ever being used as a fallback for a real Seed, and stops a real
 * Seed's id from ever accidentally matching the demo one.
 *
 * Replace this with a real per-user data model before shipping past a
 * prototype.
 */
const DEMO_ACCOUNT_EMAIL = "hema@seedandgrove.dev";
export const DEMO_SEED_ID = "demo-visiq";

export function isDemoAccount(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.toLowerCase() === DEMO_ACCOUNT_EMAIL.toLowerCase();
}

export function isDemoSeed(seedId: string | null | undefined): boolean {
  return seedId === DEMO_SEED_ID;
}
