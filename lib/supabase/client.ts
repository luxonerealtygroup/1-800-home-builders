import { getSupabaseEnv } from "./env";

type QueryValue = string | number | boolean;
const SESSION_KEY = "adu-crm-supabase-session";

export type SupabaseAuthSession = {
  access_token: string;
  expires_at?: number;
  refresh_token?: string;
  token_type?: string;
  user?: {
    email?: string;
    id: string;
  };
};

export class SupabaseRestError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "SupabaseRestError";
  }
}

function formatSupabaseError(body: string, status: number) {
  try {
    const parsed = JSON.parse(body) as {
      code?: string;
      details?: string;
      hint?: string;
      message?: string;
    };
    const message = parsed.message || body;
    const hint = parsed.hint ? ` Hint: ${parsed.hint}` : "";
    const details = parsed.details ? ` Details: ${parsed.details}` : "";

    if (status === 401 || status === 403 || parsed.code === "42501") {
      return `Supabase permission error (${status}). Check that the user is signed in and Row Level Security policies allow read/write access to the requested table. ${message}${details}${hint}`;
    }

    if (status === 404 || parsed.code === "42P01") {
      return `Supabase table or endpoint not found (${status}). Confirm the required table exists in the public schema. ${message}${details}${hint}`;
    }

    return `Supabase request failed (${status}). ${message}${details}${hint}`;
  } catch {
    if (status === 401 || status === 403) {
      return `Supabase permission error (${status}). Check authentication and Row Level Security policies. ${body}`;
    }

    if (status === 404) {
      return `Supabase table or endpoint not found (${status}). Confirm the required table exists in the public schema. ${body}`;
    }

    return `Supabase request failed (${status}). ${body}`;
  }
}

function buildUrl(table: string, query?: Record<string, QueryValue>) {
  const env = getSupabaseEnv();
  const url = new URL(`${env.url.replace(/\/$/, "")}/rest/v1/${table}`);

  Object.entries(query ?? {}).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });

  return url.toString();
}

async function request<T>(
  table: string,
  init: RequestInit,
  query?: Record<string, QueryValue>,
) {
  const env = getSupabaseEnv();

  if (!env.isConfigured) {
    throw new SupabaseRestError("Supabase environment variables are missing.", 0);
  }

  const session = getStoredSupabaseSession();
  const bearerToken = session?.access_token ?? env.anonKey;

  let response: Response;

  try {
    response = await fetch(buildUrl(table, query), {
      ...init,
      headers: {
        apikey: env.anonKey,
        Authorization: `Bearer ${bearerToken}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
        ...(init.headers ?? {}),
      },
    });
  } catch {
    throw new SupabaseRestError(
      `Could not reach Supabase at ${env.url}. Check NEXT_PUBLIC_SUPABASE_URL in Vercel and .env.local, and confirm the Supabase project is active.`,
      0,
    );
  }

  if (!response.ok) {
    const body = await response.text();

    throw new SupabaseRestError(
      formatSupabaseError(body, response.status),
      response.status,
    );
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}

export const supabaseRestClient = {
  delete<T>(table: string, query?: Record<string, QueryValue>) {
    return request<T>(table, { method: "DELETE" }, query);
  },
  get<T>(table: string, query?: Record<string, QueryValue>) {
    return request<T>(table, { method: "GET" }, query);
  },
  insert<T>(table: string, body: unknown) {
    return request<T>(table, {
      body: JSON.stringify(body),
      method: "POST",
    });
  },
  update<T>(table: string, body: unknown, query?: Record<string, QueryValue>) {
    return request<T>(
      table,
      {
        body: JSON.stringify(body),
        method: "PATCH",
      },
      query,
    );
  },
};

export { getSupabaseEnv };

export function clearStoredSupabaseSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(SESSION_KEY);
}

export function getStoredSupabaseSession() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedSession = window.localStorage.getItem(SESSION_KEY);

    if (!storedSession) {
      return null;
    }

    const session = JSON.parse(storedSession) as SupabaseAuthSession;

    if (!session.access_token) {
      return null;
    }

    if (session.expires_at && session.expires_at * 1000 < Date.now()) {
      clearStoredSupabaseSession();
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export function setStoredSupabaseSession(session: SupabaseAuthSession) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}
