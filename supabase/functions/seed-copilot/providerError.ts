// Turns whatever callGroq/callClaude throw into a coarse, stable category
// so failures can be told apart in the function logs (and, if we ever want
// it, in metrics/alerting) without parsing free-text provider messages by
// hand every time. groq.ts/claude.ts both throw plain Errors whose message
// embeds the HTTP status as "(<status>)" on a non-2xx response — see each
// file's non-ok branch — so that's the primary signal; a couple of
// well-known error shapes (timeout, DNS/network failure, malformed model
// output) are recognized by error name/message instead, since they never
// reach the point of having an HTTP status at all.
export type ProviderErrorCode =
  | "invalid_api_key"
  | "rate_limited"
  | "model_unavailable"
  | "provider_outage"
  | "timeout"
  | "network_error"
  | "bad_model_output"
  | "not_configured"
  | "unknown";

export interface ClassifiedProviderError {
  code: ProviderErrorCode;
  status: number | null;
  message: string;
}

export function classifyProviderError(err: unknown): ClassifiedProviderError {
  const message = err instanceof Error ? err.message : String(err);
  const name = err instanceof Error ? err.name : "";

  // AbortSignal.timeout() rejects with a DOMException named "TimeoutError"
  // (not "AbortError") once the deadline passes — see groq.ts/claude.ts's
  // fetch call.
  if (name === "TimeoutError") {
    return { code: "timeout", status: null, message };
  }

  // A fetch() that never reached the server at all (DNS failure, TLS
  // failure, connection refused) throws a TypeError in both the browser
  // and Deno's fetch implementation, with no HTTP status to inspect.
  if (name === "TypeError" && /fetch|network|dns/i.test(message)) {
    return { code: "network_error", status: null, message };
  }

  if (/not configured on this function/i.test(message)) {
    return { code: "not_configured", status: null, message };
  }

  if (/did not return a (structured tool call|valid structured tool response)|not valid JSON/i.test(message)) {
    return { code: "bad_model_output", status: null, message };
  }

  const statusMatch = message.match(/\((\d{3})\)/);
  const status = statusMatch ? Number(statusMatch[1]) : null;

  if (status === 401 || status === 403) {
    return { code: "invalid_api_key", status, message };
  }
  if (status === 429) {
    return { code: "rate_limited", status, message };
  }
  if (status === 404) {
    return { code: "model_unavailable", status, message };
  }
  if (status !== null && status >= 500) {
    return { code: "provider_outage", status, message };
  }

  return { code: "unknown", status, message };
}
