import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/laboratories/$labId/areas")({
  component: () => <Outlet />,
});
