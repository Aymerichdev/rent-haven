## Goal

Replace the in-memory Zustand mock data layer with real Supabase calls without touching any route/component code. Then add image uploads (Storage bucket `property-images`) to building/unit/amenity forms.

UI stays identical. All `useAppStore` selectors and action signatures stay the same, so no route file needs structural changes — only the building/unit/amenity forms get a new `<ImageUploader>` component.

## Approach

The store currently exposes synchronous actions like `addBuilding(b) → string` and arrays like `buildings: Building[]`. Supabase is async. To avoid rewriting every route, I'll:

1. Keep `useAppStore` as the single source of truth in memory, populated from Supabase on login (and on realtime/refetch).
2. Convert actions to **async** internally — they call Supabase, then update local state with the returned row. Callers that already used them synchronously (almost all do `void` calls or chain via local state) keep working because React re-renders when the store updates. The 1–2 spots that consumed the return value (e.g. `addBuilding` → `string`) become `Promise<string>` and I'll add `await` only there.
3. Map snake_case ↔ camelCase at the store boundary so `Building.ownerId` in the UI continues to work while the DB column is `owner_id`. A tiny `mappers.ts` per entity.
4. Auth uses `supabase.auth.*` (email/password) + `profiles` table for role/name/avatar. `currentUser` is hydrated from `onAuthStateChange`.

## Files

**New**
- `src/lib/mappers.ts` — `rowToBuilding`, `buildingToRow`, … for all 10 tables.
- `src/lib/storage.ts` — `uploadImages(folder, files)`, `deleteImage(url)`, validation (image/*, 5MB).
- `src/components/site/ImageUploader.tsx` — shadcn file input + previews + remove buttons. Two variants: `multi` (buildings/units) and `single` (amenities).

**Rewrite**
- `src/lib/store.ts` — same interface, Supabase-backed. Adds `hydrate()` called on login. Removes `persist` middleware (Supabase is the source of truth; only `currentUser` session is restored via supabase auth).

**Edit**
- `src/routes/__root.tsx` — install `onAuthStateChange` listener that sets `currentUser` and triggers `hydrate()`.
- `src/routes/owner.buildings.tsx` — add `<ImageUploader multi>` to create/edit dialogs, block submit if `images.length === 0`.
- `src/routes/owner.buildings.$buildingId.tsx` — same in edit form if applicable.
- `src/routes/owner.units.tsx` — add `<ImageUploader multi>`, same validation.
- `src/routes/owner.amenities.tsx` — add `<ImageUploader single>`, optional.
- `src/lib/types.ts` — add `images: string[]` to `Building`/`Unit` if missing; ensure `photoUrl` on `Amenity`.

**Delete / neutralize**
- `src/lib/mock-data.ts` — replace exports with empty arrays (kept for type compat) so legacy imports don't crash mid-migration.

## Auth mapping

| Store action | Supabase call |
|---|---|
| `login(email, pwd)` | `auth.signInWithPassword` → fetch `profiles` row |
| `register({...})` | `auth.signUp` (trigger creates profile) → update role/name |
| `logout()` | `auth.signOut()` |
| `changePassword(old, new)` | re-auth then `auth.updateUser({password})` |
| `resetPassword(email)` | `auth.resetPasswordForEmail` |

## Storage

- Bucket: `property-images` (assumed public read).
- Paths: `buildings/{id}/{uuid}.{ext}`, `units/{id}/{uuid}.{ext}`, `amenities/{id}/{ext}`.
- Flow: create record first (to get id) → upload files → patch row with `images`/`photo_url` URLs. For new records, do it in one transaction-ish flow (insert empty images, upload, update).
- On delete record: list folder, remove all files, then delete row.
- On image remove in edit: delete from storage, update row.

## Risks & mitigations

- **Async breakage**: a handful of routes assume sync returns (e.g. `addBuilding` returns id, navigate immediately). I'll `await` those (3-4 spots, max).
- **RLS**: I trust the user that policies are in place. If a query fails, I'll surface the Postgres error via toast — not silently swallow.
- **Realtime / multi-user**: out of scope. Hydrate on login + refetch after mutations is enough.
- **`mock-data.ts` removal**: I'll keep the file but export empty arrays to avoid a cascade of broken imports during the migration.

## Out of scope

- Realtime subscriptions.
- Migrating receipts in `payments` to Supabase Storage (separate scope — currently base64; I'll leave as-is unless you say otherwise).
- Redesigning any form.

## Verification

After build, I'll smoke-test by:
1. Loading the preview and checking console for errors.
2. Confirming login flow against Supabase.
3. Creating one building with an image upload to verify Storage path + URL persistence.

If any step fails I'll iterate before declaring done.
