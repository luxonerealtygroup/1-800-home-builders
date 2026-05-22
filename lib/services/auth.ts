import {
  clearStoredSupabaseSession,
  getStoredSupabaseSession,
  getSupabaseEnv,
  setStoredSupabaseSession,
  type SupabaseAuthSession,
} from "@/lib/supabase/client";
import type { DbUser } from "@/lib/supabase/database";
import { usersService } from "./users";

type SupabasePasswordResponse = SupabaseAuthSession & {
  expires_in?: number;
};

async function authRequest<T>(path: string, body?: unknown) {
  const env = getSupabaseEnv();

  if (!env.isConfigured) {
    throw new Error("Supabase environment variables are missing.");
  }

  let response: Response;

  try {
    response = await fetch(`${env.url.replace(/\/$/, "")}/auth/v1/${path}`, {
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        apikey: env.anonKey,
        Authorization: `Bearer ${env.anonKey}`,
        "Content-Type": "application/json",
      },
      method: body ? "POST" : "GET",
    });
  } catch {
    throw new Error(
      `Could not reach Supabase Auth at ${env.url}. Check NEXT_PUBLIC_SUPABASE_URL in Vercel and .env.local, and confirm the Supabase project is active.`,
    );
  }

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return (await response.json()) as T;
}

function toCrmUser(dbUser: DbUser) {
  return {
    createdAt: dbUser.created_at.slice(0, 10),
    email: dbUser.email,
    id: dbUser.id,
    name: dbUser.full_name,
    password: "",
    role: dbUser.role,
  };
}

export const authService = {
  async getCurrentCrmUser() {
    const session = getStoredSupabaseSession();

    if (!session?.user?.id) {
      return null;
    }

    const dbUser =
      (await usersService.findUserByAuthId(session.user.id)) ??
      (session.user.email
        ? await usersService.findUserByEmail(session.user.email)
        : null);

    return dbUser ? toCrmUser(dbUser) : null;
  },
  async signIn(email: string, password: string) {
    const session = await authRequest<SupabasePasswordResponse>(
      "token?grant_type=password",
      {
        email,
        password,
      },
    );
    const expiresAt = session.expires_at
      ? session.expires_at
      : session.expires_in
        ? Math.floor(Date.now() / 1000) + session.expires_in
        : undefined;

    setStoredSupabaseSession({
      ...session,
      expires_at: expiresAt,
    });

    const dbUser =
      (session.user?.id
        ? await usersService.findUserByAuthId(session.user.id)
        : null) ??
      (session.user?.email
        ? await usersService.findUserByEmail(session.user.email)
        : null);

    if (!dbUser) {
      throw new Error("Supabase Auth succeeded, but no CRM user profile exists.");
    }

    return toCrmUser(dbUser);
  },
  signOut() {
    clearStoredSupabaseSession();
  },
};
