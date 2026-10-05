import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/admin/users")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/users" });
  },
});
