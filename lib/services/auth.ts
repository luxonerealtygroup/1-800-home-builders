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

type SupabaseSignupResponse = {
  user?: {
    email?: string;
    id: string;
  };
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

function nameFromEmail(email: string) {
  const [namePart] = email.split("@");

  return namePart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || email;
}

async function findOrCreateCrmUser(session: SupabaseAuthSession) {
  const authUserId = session.user?.id;
  const email = session.user?.email?.toLowerCase();

  if (!authUserId || !email) {
    return null;
  }

  const dbUserByAuthId = await usersService.findUserByAuthId(authUserId);

  if (dbUserByAuthId) {
    return dbUserByAuthId;
  }

  const dbUserByEmail = await usersService.findUserByEmail(email);

  if (dbUserByEmail) {
    if (!dbUserByEmail.auth_user_id) {
      return usersService.updateUser(dbUserByEmail.id, {
        auth_user_id: authUserId,
      });
    }

    return dbUserByEmail;
  }

  return usersService.createUser({
    auth_user_id: authUserId,
    email,
    full_name: nameFromEmail(email),
    role: "sales_rep",
  });
}

export const authService = {
  async createCrmProfile(input: {
    authUserId?: string | null;
    email: string;
    name: string;
    role: DbUser["role"];
  }) {
    const existingUser = await usersService.findUserByEmail(input.email);

    if (existingUser) {
      const updatedUser = await usersService.updateUser(existingUser.id, {
        auth_user_id: existingUser.auth_user_id ?? input.authUserId ?? null,
        full_name: input.name,
        role: input.role,
      });

      return toCrmUser(updatedUser);
    }

    const createdUser = await usersService.createUser({
      auth_user_id: input.authUserId ?? null,
      email: input.email,
      full_name: input.name,
      role: input.role,
    });

    return toCrmUser(createdUser);
  },
  async createUser(email: string, password: string) {
    return authRequest<SupabaseSignupResponse>("signup", {
      email,
      password,
    });
  },
  async getCurrentCrmUser() {
    const session = getStoredSupabaseSession();

    if (!session?.user?.id) {
      return null;
    }

    const dbUser = await findOrCreateCrmUser(session);

    return dbUser ? toCrmUser(dbUser) : null;
  },
  async listCrmUsers() {
    const users = await usersService.listUsers();

    return users.map(toCrmUser);
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

    const dbUser = await findOrCreateCrmUser(session);

    if (!dbUser) {
      throw new Error("Supabase Auth succeeded, but no CRM user profile exists.");
    }

    return toCrmUser(dbUser);
  },
  signOut() {
    clearStoredSupabaseSession();
  },
};
