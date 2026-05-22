import { supabaseRestClient } from "@/lib/supabase/client";
import type { DbAppointment } from "@/lib/supabase/database";

export const appointmentsService = {
  async createAppointment(appointment: Omit<DbAppointment, "created_at" | "id" | "updated_at">) {
    const [createdAppointment] = await supabaseRestClient.insert<DbAppointment[]>(
      "appointments",
      appointment,
    );

    return createdAppointment;
  },
  async listAppointments(leadId?: string) {
    return supabaseRestClient.get<DbAppointment[]>("appointments", {
      order: "appointment_at.desc",
      select: "*",
      ...(leadId ? { lead_id: `eq.${leadId}` } : {}),
    });
  },
};
