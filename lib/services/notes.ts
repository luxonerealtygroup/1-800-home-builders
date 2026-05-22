import { supabaseRestClient } from "@/lib/supabase/client";
import type { DbNote } from "@/lib/supabase/database";

export const notesService = {
  async createNote(leadId: string, body: string, userId?: string) {
    const [createdNote] = await supabaseRestClient.insert<DbNote[]>("notes", {
      body,
      lead_id: leadId,
      user_id: userId ?? null,
    });

    return createdNote;
  },
  async listNotes(leadId?: string) {
    return supabaseRestClient.get<DbNote[]>("notes", {
      order: "created_at.desc",
      select: "*",
      ...(leadId ? { lead_id: `eq.${leadId}` } : {}),
    });
  },
};
