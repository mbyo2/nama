// Layout route for /app — renders nested routes (dashboard at /app, certificate at /app/certificate).
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  return <Outlet />;
}
