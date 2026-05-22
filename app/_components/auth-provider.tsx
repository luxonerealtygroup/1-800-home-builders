"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { authService } from "@/lib/services/auth";
import {
  clearStoredSupabaseSession,
  getSupabaseEnv,
} from "@/lib/supabase/client";

export type UserRole = "admin" | "sales_rep";
export type AuthMode = "local" | "supabase";

export type CrmUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password: string;
  createdAt: string;
};

type NewUserInput = {
  name: string;
  email: string;
  role: UserRole;
  password: string;
};

type StoredCrmUser = Omit<CrmUser, "role"> & {
  role: UserRole | "rep";
};

type AuthContextValue = {
  addUser: (input: NewUserInput) => Promise<{ ok: boolean; message: string }>;
  authMode: AuthMode;
  canManageUsers: boolean;
  deleteUser: (userId: string) => { ok: boolean; message: string };
  loading: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ ok: boolean; message: string }>;
  logout: () => void;
  updateUser: (
    userId: string,
    input: Omit<NewUserInput, "password"> & { password?: string },
  ) => { ok: boolean; message: string };
  user: CrmUser | null;
  users: CrmUser[];
};

const USERS_KEY = "adu-crm-users";
const SESSION_KEY = "adu-crm-session";

const defaultUsers: CrmUser[] = [
  {
    id: "admin-1",
    name: "Creative911 Media",
    email: "creative911media@gmail.com",
    role: "admin",
    password: "Vegas@1212",
    createdAt: "2026-05-19",
  },
  {
    id: "rep-1",
    name: "Sales Rep",
    email: "rep@adusales.local",
    role: "sales_rep",
    password: "rep123",
    createdAt: "2026-05-19",
  },
  {
    id: "rep-manny",
    name: "Manny",
    email: "manny@adusales.local",
    role: "sales_rep",
    password: "manny123",
    createdAt: "2026-05-21",
  },
  {
    id: "admin-angel",
    name: "Angel",
    email: "angel@adusales.local",
    role: "admin",
    password: "angel123",
    createdAt: "2026-05-21",
  },
  {
    id: "admin-jake",
    name: "Jake",
    email: "jake@adusales.local",
    role: "admin",
    password: "jake123",
    createdAt: "2026-05-21",
  },
];

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredUsers() {
  try {
    const storedUsers = window.localStorage.getItem(USERS_KEY);

    if (!storedUsers) {
      return defaultUsers;
    }

    const parsedUsers = JSON.parse(storedUsers);

    if (!Array.isArray(parsedUsers)) {
      return defaultUsers;
    }

    return parsedUsers.filter((storedUser): storedUser is StoredCrmUser => {
      return (
        typeof storedUser?.id === "string" &&
        typeof storedUser?.name === "string" &&
        typeof storedUser?.email === "string" &&
        (storedUser?.role === "admin" ||
          storedUser?.role === "sales_rep" ||
          storedUser?.role === "rep") &&
        typeof storedUser?.password === "string" &&
        typeof storedUser?.createdAt === "string"
      );
    }).map((storedUser): CrmUser => ({
      ...storedUser,
      role: storedUser.role === "rep" ? "sales_rep" : storedUser.role,
    }));
  } catch {
    return defaultUsers;
  }
}

function upsertDefaultUsers(storedUsers: CrmUser[]): CrmUser[] {
  const protectedAdmin = defaultUsers[0];
  const seededUsers = [...storedUsers];

  defaultUsers.forEach((defaultUser) => {
    const existingIndex = seededUsers.findIndex(
      (storedUser) =>
        storedUser.email.toLowerCase() === defaultUser.email.toLowerCase(),
    );

    if (existingIndex === -1) {
      seededUsers.push(defaultUser);
      return;
    }

    if (defaultUser.id === protectedAdmin.id) {
      seededUsers[existingIndex] = {
        ...seededUsers[existingIndex],
        name: protectedAdmin.name,
        role: "admin",
        password: protectedAdmin.password,
      };
    }
  });

  return seededUsers;
}

function findLocalUser(email: string) {
  const latestUsers = upsertDefaultUsers(readStoredUsers());
  const matchingUser = latestUsers.find(
    (candidate) => candidate.email.toLowerCase() === email,
  );

  window.localStorage.setItem(USERS_KEY, JSON.stringify(latestUsers));

  return { latestUsers, matchingUser };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<CrmUser[]>(defaultUsers);
  const [user, setUser] = useState<CrmUser | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>("local");
  const [loading, setLoading] = useState(true);
  const hasSupabaseConfig = getSupabaseEnv().isConfigured;

  useEffect(() => {
    queueMicrotask(() => {
      async function loadSession() {
        const seededUsers = upsertDefaultUsers(readStoredUsers());
        const sessionUserId = window.localStorage.getItem(SESSION_KEY);

        window.localStorage.setItem(USERS_KEY, JSON.stringify(seededUsers));
        setUsers(seededUsers);

        if (hasSupabaseConfig) {
          try {
            const supabaseUser = await authService.getCurrentCrmUser();

            if (supabaseUser) {
              const supabaseUsers = await authService.listCrmUsers();

              setUser(supabaseUser);
              setUsers(supabaseUsers);
              setAuthMode("supabase");
              setLoading(false);
              return;
            }
          } catch {
            authService.signOut();
          }

          setUser(null);
          setAuthMode("local");
          window.localStorage.removeItem(SESSION_KEY);
          setLoading(false);
          return;
        }

        setUser(
          seededUsers.find((storedUser) => storedUser.id === sessionUserId) ??
            null,
        );
        setAuthMode("local");
        setLoading(false);
      }

      void loadSession();
    });
  }, [hasSupabaseConfig]);

  const persistUsers = useCallback((nextUsers: CrmUser[]) => {
    setUsers(nextUsers);
    window.localStorage.setItem(USERS_KEY, JSON.stringify(nextUsers));
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const normalizedEmail = email.trim().toLowerCase();
      const signInLocally = (matchingUser: CrmUser) => {
        clearStoredSupabaseSession();
        setUser(matchingUser);
        setAuthMode("local");
        window.localStorage.setItem(SESSION_KEY, matchingUser.id);
      };

      if (hasSupabaseConfig) {
        try {
          const supabaseUser = await authService.signIn(normalizedEmail, password);

          setUser(supabaseUser);
          setAuthMode("supabase");
          window.localStorage.setItem(SESSION_KEY, supabaseUser.id);
          return { ok: true, message: "Signed in with Supabase." };
        } catch (error) {
          const supabaseMessage =
            error instanceof Error
              ? error.message
              : "Supabase login failed.";

          const { latestUsers, matchingUser } = findLocalUser(normalizedEmail);

          setUsers(latestUsers);

          if (matchingUser) {
            if (matchingUser.password !== password) {
              return {
                ok: false,
                message: "Password does not match this user.",
              };
            }

            signInLocally(matchingUser);
            return { ok: true, message: "Signed in with local workspace account." };
          }

          return { ok: false, message: supabaseMessage };
        }
      }

      const { latestUsers, matchingUser } = findLocalUser(normalizedEmail);

      setUsers(latestUsers);

      if (!matchingUser) {
        return {
          ok: false,
          message: "No user found with that email. Admins can add users in Admin > Users.",
        };
      }

      if (matchingUser.password !== password) {
        return {
          ok: false,
          message: "Password does not match this user.",
        };
      }

      signInLocally(matchingUser);

      return { ok: true, message: "Signed in." };
    },
    [hasSupabaseConfig],
  );

  const logout = useCallback(() => {
    authService.signOut();
    setUser(null);
    setAuthMode("local");
    window.localStorage.removeItem(SESSION_KEY);
  }, []);

  const addUser = useCallback(
    async (input: NewUserInput) => {
      const normalizedEmail = input.email.trim().toLowerCase();

      if (users.some((candidate) => candidate.email.toLowerCase() === normalizedEmail)) {
        return { ok: false, message: "A user with that email already exists." };
      }

      if (users.length >= 10) {
        return { ok: false, message: "This workspace is capped at 10 users." };
      }

      if (hasSupabaseConfig && authMode === "supabase") {
        try {
          const authUser = await authService.createUser(normalizedEmail, input.password)
            .catch(() => ({ user: undefined }));
          const createdUser = await authService.createCrmProfile({
            authUserId: authUser.user?.id ?? null,
            email: normalizedEmail,
            name: input.name.trim(),
            role: input.role,
          });
          const supabaseUsers = await authService.listCrmUsers();

          setUsers(supabaseUsers);

          return { ok: true, message: `${createdUser.name} was added.` };
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Could not add this Supabase user.";

          return { ok: false, message };
        }
      }

      const newUser: CrmUser = {
        id: crypto.randomUUID(),
        name: input.name.trim(),
        email: normalizedEmail,
        role: input.role,
        password: input.password,
        createdAt: new Date().toISOString().slice(0, 10),
      };

      persistUsers([...users, newUser]);

      return { ok: true, message: `${newUser.name} was added.` };
    },
    [authMode, hasSupabaseConfig, persistUsers, users],
  );

  const deleteUser = useCallback(
    (userId: string) => {
      const targetUser = users.find((candidate) => candidate.id === userId);

      if (!targetUser) {
        return { ok: false, message: "User not found." };
      }

      if (targetUser.id === defaultUsers[0].id) {
        return { ok: false, message: "The main admin account cannot be deleted." };
      }

      if (targetUser.id === user?.id) {
        return { ok: false, message: "You cannot delete your own active account." };
      }

      const remainingUsers = users.filter((candidate) => candidate.id !== userId);
      const remainingAdmins = remainingUsers.filter(
        (candidate) => candidate.role === "admin",
      );

      if (remainingAdmins.length === 0) {
        return { ok: false, message: "At least one admin must remain." };
      }

      persistUsers(remainingUsers);

      return { ok: true, message: `${targetUser.name} was deleted.` };
    },
    [persistUsers, user?.id, users],
  );

  const updateUser = useCallback(
    (
      userId: string,
      input: Omit<NewUserInput, "password"> & { password?: string },
    ) => {
      const normalizedEmail = input.email.trim().toLowerCase();

      if (
        users.some(
          (candidate) =>
            candidate.id !== userId &&
            candidate.email.toLowerCase() === normalizedEmail,
        )
      ) {
        return { ok: false, message: "A user with that email already exists." };
      }

      const existingUser = users.find((candidate) => candidate.id === userId);

      if (!existingUser) {
        return { ok: false, message: "User not found." };
      }

      const updatedUser: CrmUser = {
        ...existingUser,
        name: input.name.trim(),
        email: normalizedEmail,
        role: input.role,
        password: input.password || existingUser.password,
      };
      const nextUsers = users.map((candidate) =>
        candidate.id === userId ? updatedUser : candidate,
      );

      persistUsers(nextUsers);
      setUser((currentUser) =>
        currentUser?.id === userId ? updatedUser : currentUser,
      );

      return { ok: true, message: `${updatedUser.name} was updated.` };
    },
    [persistUsers, users],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      addUser,
      authMode,
      canManageUsers: user?.role === "admin",
      deleteUser,
      loading,
      login,
      logout,
      updateUser,
      user,
      users,
    }),
    [addUser, authMode, deleteUser, loading, login, logout, updateUser, user, users],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
