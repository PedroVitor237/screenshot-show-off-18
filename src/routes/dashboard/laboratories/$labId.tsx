import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell, LabShell, RequireSession } from "@/components/hf/layout";

export const Route = createFileRoute("/dashboard/laboratories/$labId")({
  component: LabLayout,
});

function LabLayout() {
  return (
    <RequireSession>
      <AppShell>
        <LabShell>
          <Outlet />
        </LabShell>
      </AppShell>
    </RequireSession>
  );
}
