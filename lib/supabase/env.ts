export type SupabaseEnvState = {
  anonKey: string;
  isConfigured: boolean;
  missing: string[];
  url: string;
};

export function getSupabaseEnv(): SupabaseEnvState {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const missing = [
    !url ? "NEXT_PUBLIC_SUPABASE_URL" : "",
    !anonKey ? "NEXT_PUBLIC_SUPABASE_ANON_KEY" : "",
  ].filter(Boolean);

  return {
    anonKey,
    isConfigured: missing.length === 0,
    missing,
    url,
  };
}
