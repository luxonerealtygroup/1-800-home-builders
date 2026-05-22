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

  const response = await fetch(buildUrl(table, query), {
    ...init,
    headers: {
      apikey: env.anonKey,
      Authorization: `Bearer ${bearerToken}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new SupabaseRestError(await response.text(), response.status);
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
