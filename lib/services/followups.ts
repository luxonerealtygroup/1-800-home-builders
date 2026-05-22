import { supabaseRestClient } from "@/lib/supabase/client";
import type { DbFollowup } from "@/lib/supabase/database";

export const followupsService = {
  async createFollowup(followup: Omit<DbFollowup, "created_at" | "id" | "updated_at">) {
    const [createdFollowup] = await supabaseRestClient.insert<DbFollowup[]>(
      "followups",
      followup,
    );

    return createdFollowup;
  },
  async listFollowups(leadId?: string) {
    return supabaseRestClient.get<DbFollowup[]>("followups", {
      order: "due_at.asc",
      select: "*",
      ...(leadId ? { lead_id: `eq.${leadId}` } : {}),
    });
  },
  async updateFollowup(followupId: string, followup: Partial<DbFollowup>) {
    const [updatedFollowup] = await supabaseRestClient.update<DbFollowup[]>(
      "followups",
      { ...followup, updated_at: new Date().toISOString() },
      { id: `eq.${followupId}` },
    );

    return updatedFollowup;
  },
};
