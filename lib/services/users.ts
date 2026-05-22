import { supabaseRestClient } from "@/lib/supabase/client";
import type { DbUser } from "@/lib/supabase/database";

export const usersService = {
  async createUser(
    user: Pick<DbUser, "email" | "full_name" | "role"> &
      Partial<Pick<DbUser, "auth_user_id">>,
  ) {
    const [createdUser] = await supabaseRestClient.insert<DbUser[]>(
      "users",
      user,
    );

    return createdUser;
  },
  async listUsers() {
    return supabaseRestClient.get<DbUser[]>("users", {
      order: "created_at.desc",
      select: "*",
    });
  },
  async findUserByAuthId(authUserId: string) {
    const [user] = await supabaseRestClient.get<DbUser[]>("users", {
      auth_user_id: `eq.${authUserId}`,
      limit: 1,
      select: "*",
    });

    return user ?? null;
  },
  async findUserByEmail(email: string) {
    const [user] = await supabaseRestClient.get<DbUser[]>("users", {
      email: `eq.${email.toLowerCase()}`,
      limit: 1,
      select: "*",
    });

    return user ?? null;
  },
  async updateUser(userId: string, user: Partial<DbUser>) {
    const [updatedUser] = await supabaseRestClient.update<DbUser[]>(
      "users",
      { ...user, updated_at: new Date().toISOString() },
      { id: `eq.${userId}` },
    );

    return updatedUser;
  },
};
