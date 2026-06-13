import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { cleanupAuthSubscription, useAppStore } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "BR Internacional" },
      { name: "description", content: "Administración de propiedades, alquileres y condominios en Costa Rica." },
      { name: "author", content: "BR Internacional" },
      { property: "og:site_name", content: "BR Internacional" },
      { property: "og:title", content: "BR Internacional" },
      { property: "og:description", content: "Administración de propiedades, alquileres y condominios en Costa Rica." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const init = useAppStore((s) => s.init);
  const hydrate = useAppStore((s) => s.hydrate);
  const logout = useAppStore((s) => s.logout);
  useEffect(() => {
    init();
    return () => {
      cleanupAuthSubscription();
    };
  }, [init]);
  useEffect(() => {
    const onUnload = () => {
      try {
        cleanupAuthSubscription();
      } catch (e) {
        // ignore
      }
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, []);
  useEffect(() => {
    const onVisibilityChange = async () => {
      if (document.visibilityState !== "visible") return;
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        await hydrate();
      } else {
        await logout();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [hydrate, logout]);
  return (
    <>
      <Outlet />
      <Toaster richColors position="top-right" />
    </>
  );
}
