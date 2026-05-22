import { getSupabaseEnv } from "@/lib/supabase/client";

export { getSupabaseEnv, supabaseRestClient, SupabaseRestError } from "@/lib/supabase/client";

export function hasSupabaseConfig() {
  return getSupabaseEnv().isConfigured;
}
