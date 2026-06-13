import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RequireRole } from "@/components/site/RequireRole";
import { DashboardShell } from "@/components/site/DashboardShell";
import { LayoutDashboard, Building2, DoorOpen, Sparkles, Gauge, Inbox, CreditCard, UserRound, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/owner")({
  component: Layout,
});

function Layout() {
  return (
    <RequireRole role="owner">
      <DashboardShell
        brand="BR Internacional"
        brandTag="Propietario"
        items={[
          { to: "/owner", label: "Resumen", icon: <LayoutDashboard className="h-4 w-4" /> },
          { to: "/owner/buildings", label: "Edificios", icon: <Building2 className="h-4 w-4" /> },
          { to: "/owner/units", label: "Unidades", icon: <DoorOpen className="h-4 w-4" /> },
          { to: "/owner/amenities", label: "Amenidades", icon: <Sparkles className="h-4 w-4" /> },
          { to: "/owner/meters", label: "Medidores", icon: <Gauge className="h-4 w-4" /> },
          { to: "/owner/requests", label: "Solicitudes", icon: <Inbox className="h-4 w-4" /> },
          { to: "/owner/messages", label: "Mensajes", icon: <MessageSquare className="h-4 w-4" /> },
          { to: "/owner/payments", label: "Pagos", icon: <CreditCard className="h-4 w-4" /> },
          { to: "/owner/profile", label: "Mi perfil", icon: <UserRound className="h-4 w-4" /> },
        ]}
      >
        <Outlet />
      </DashboardShell>
    </RequireRole>
  );
}
