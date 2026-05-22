import type { CrmUser } from "../_components/auth-provider";
import type { Lead } from "./crm-data";

export function canViewAllLeads(user: CrmUser | null) {
  return Boolean(user);
}

export function canViewLead(user: CrmUser | null, lead: Lead) {
  if (!user) {
    return false;
  }

  if (lead.isArchived) {
    return user.role === "admin";
  }

  if (canViewAllLeads(user)) {
    return true;
  }

  return lead.assignedRep.toLowerCase() === user.name.toLowerCase();
}

export function getVisibleLeads(user: CrmUser | null, leads: Lead[]) {
  const activeLeads = leads.filter((lead) => !lead.isArchived);

  return canViewAllLeads(user)
    ? activeLeads
    : activeLeads.filter((lead) => canViewLead(user, lead));
}

export function canAssignLeads(user: CrmUser | null) {
  return user?.role === "admin";
}
