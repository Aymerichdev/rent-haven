// No-op: la autenticación ahora la maneja el shim de `client.ts` (inyecta Bearer en cada fetch).
// Conservamos el export para no romper `src/start.ts`.
import { createMiddleware } from "@tanstack/react-start";

export const attachSupabaseAuth = createMiddleware({ type: "function" }).client(async ({ next }) => {
  return next();
});
