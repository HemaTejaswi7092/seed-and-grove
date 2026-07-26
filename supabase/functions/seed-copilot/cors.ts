// Standard Supabase Edge Function CORS boilerplate. The browser calls this
// function directly (via supabase.functions.invoke), so it needs to answer
// the preflight OPTIONS request and echo these headers on every response.
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
