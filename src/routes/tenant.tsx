import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RequireRole } from "@/components/site/RequireRole";
import { DashboardShell } from "@/components/site/DashboardShell";
import { LayoutDashboard, Home, FileText, CreditCard, Sparkles, Inbox, UserRound, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/tenant")({
  component: Layout,
});

function Layout() {
  return (
    <RequireRole role="tenant">
      <DashboardShell
        brand="BR Internacional"
        brandTag="Inquilino"
        items={[
          { to: "/tenant", label: "Resumen", icon: <LayoutDashboard className="h-4 w-4" /> },
          { to: "/tenant/rentals", label: "Mis alquileres", icon: <Home className="h-4 w-4" /> },
          { to: "/tenant/requests", label: "Mis solicitudes", icon: <Inbox className="h-4 w-4" /> },
          { to: "/tenant/messages", label: "Mensajes", icon: <MessageSquare className="h-4 w-4" /> },
          { to: "/tenant/contracts", label: "Contratos", icon: <FileText className="h-4 w-4" /> },
          { to: "/tenant/payments", label: "Pagos", icon: <CreditCard className="h-4 w-4" /> },
          { to: "/tenant/amenities", label: "Reservar amenidades", icon: <Sparkles className="h-4 w-4" /> },
          { to: "/tenant/profile", label: "Mi perfil", icon: <UserRound className="h-4 w-4" /> },
        ]}
      >
        <Outlet />
      </DashboardShell>
    </RequireRole>
  );
}
