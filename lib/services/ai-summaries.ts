import { supabaseRestClient } from "@/lib/supabase/client";
import type { DbAiSummary } from "@/lib/supabase/database";

export const aiSummariesService = {
  async createSummary(summary: Omit<DbAiSummary, "created_at" | "id" | "updated_at">) {
    const [createdSummary] = await supabaseRestClient.insert<DbAiSummary[]>(
      "ai_summaries",
      summary,
    );

    return createdSummary;
  },
  async listSummaries(leadId?: string) {
    return supabaseRestClient.get<DbAiSummary[]>("ai_summaries", {
      order: "created_at.desc",
      select: "*",
      ...(leadId ? { lead_id: `eq.${leadId}` } : {}),
    });
  },
};
