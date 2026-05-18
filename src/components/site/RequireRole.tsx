import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAppStore } from "@/lib/store";
import type { Role } from "@/lib/types";

export function RequireRole({ role, children }: { role: Role; children: React.ReactNode }) {
  const user = useAppStore((s) => s.currentUser);
  const nav = useNavigate();
  useEffect(() => {
    if (!user) {
      nav({ to: "/login" });
      return;
    }
    if (user.role !== role) {
      nav({ to: "/" });
    }
  }, [user, role, nav]);

  if (!user || user.role !== role) return null;
  return <>{children}</>;
}
