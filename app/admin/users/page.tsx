import { AppShell } from "../../_components/app-shell";
import { PageHeader } from "../../_components/page-header";
import { UserAdminPanel } from "./user-admin-panel";

export default function UsersPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Admin"
        title="Workspace users"
        description="Manage the small internal team that can access the ADU sales CRM."
      />
      <UserAdminPanel />
    </AppShell>
  );
}
