/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  // "mock" (default) uses the local dev assistant; "api" calls a secure
  // backend endpoint instead. See docs/ai-integration.md.
  readonly VITE_AI_MODE?: "mock" | "api";
  readonly VITE_AI_BACKEND_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
