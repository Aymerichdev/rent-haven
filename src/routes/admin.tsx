import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RequireRole } from "@/components/site/RequireRole";
import { DashboardShell } from "@/components/site/DashboardShell";
import { LayoutDashboard, Users } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: Layout,
});

function Layout() {
  return (
    <RequireRole role="admin">
      <DashboardShell
        brand="BR Internacional"
        brandTag="Admin"
        items={[
          { to: "/admin", label: "Resumen", icon: <LayoutDashboard className="h-4 w-4" /> },
          { to: "/admin/users", label: "Usuarios", icon: <Users className="h-4 w-4" /> },
        ]}
      >
        <Outlet />
      </DashboardShell>
    </RequireRole>
  );
}
