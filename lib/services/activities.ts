import type { ActivityEntry } from "@/app/_lib/crm-data";
import { supabaseRestClient } from "@/lib/supabase/client";
import type { DbActivity, DbActivityType } from "@/lib/supabase/database";

const dbTypeByActivityType: Record<ActivityEntry["type"], DbActivityType> = {
  ai: "ai",
  appointment: "appointment",
  call: "call",
  email: "email",
  "follow-up": "follow_up",
  note: "note",
  text: "text",
};

const activityTypeByDbType: Record<DbActivityType, ActivityEntry["type"]> = {
  ai: "ai",
  appointment: "appointment",
  assignment: "note",
  call: "call",
  email: "email",
  follow_up: "follow-up",
  note: "note",
  text: "text",
};

export const activitiesService = {
  fromDbActivity(activity: DbActivity): ActivityEntry {
    return {
      createdAt: activity.created_at,
      detail: activity.detail ?? "",
      id: activity.id,
      label: activity.title,
      type: activityTypeByDbType[activity.type],
    };
  },
  async createActivity(leadId: string, activity: Omit<ActivityEntry, "id">) {
    const [createdActivity] = await supabaseRestClient.insert<DbActivity[]>(
      "activities",
      {
        detail: activity.detail,
        lead_id: leadId,
        title: activity.label,
        type: dbTypeByActivityType[activity.type],
      },
    );

    return createdActivity;
  },
  async listActivities() {
    return supabaseRestClient.get<DbActivity[]>("activities", {
      order: "created_at.desc",
      select: "*",
    });
  },
};
