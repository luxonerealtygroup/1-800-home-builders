import { supabaseRestClient } from "@/lib/supabase/client";
import type { DbCommunication } from "@/lib/supabase/database";

export const communicationsService = {
  async createCommunication(
    communication: Omit<DbCommunication, "created_at" | "id" | "updated_at">,
  ) {
    const [createdCommunication] =
      await supabaseRestClient.insert<DbCommunication[]>(
        "communications",
        communication,
      );

    return createdCommunication;
  },
  async listCommunications(leadId?: string) {
    return supabaseRestClient.get<DbCommunication[]>("communications", {
      order: "created_at.desc",
      select: "*",
      ...(leadId ? { lead_id: `eq.${leadId}` } : {}),
    });
  },
  async updateCommunication(
    communicationId: string,
    communication: Partial<DbCommunication>,
  ) {
    const [updatedCommunication] =
      await supabaseRestClient.update<DbCommunication[]>(
        "communications",
        { ...communication, updated_at: new Date().toISOString() },
        { id: `eq.${communicationId}` },
      );

    return updatedCommunication;
  },
};
