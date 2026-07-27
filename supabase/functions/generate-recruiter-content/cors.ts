// Standard Supabase Edge Function CORS boilerplate — copied verbatim from
// seed-copilot/cors.ts (each function keeps its own copy rather than a
// shared import; see this function's index.ts header comment for why).
export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
