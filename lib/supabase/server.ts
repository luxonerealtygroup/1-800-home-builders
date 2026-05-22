import { getSupabaseEnv } from "./env";

export function getSupabaseServerConfig() {
  return getSupabaseEnv();
}
