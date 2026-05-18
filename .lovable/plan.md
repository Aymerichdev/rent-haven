## Scope

Apply 9 improvements to the existing project without rebuilding. Group into phases so each can be verified.

## Phase 1 — Database schema

Run migrations:

1. Extend `tenant_profiles`:
   - `photos text[] default '{}'`
   - `employer text`, `work_certificate_url text`
   - `credit_auth boolean default false`, `credit_auth_date timestamptz`
   - drop NOT NULL on `profile_photo_url`

2. Extend `rental_requests` with snapshot fields:
   `national_id, occupation, bio, recommendations, profile_photo_url, photos text[], employer, work_certificate_url, credit_auth boolean`

3. New `messages` table + RLS (select/insert/update policies as specified).

## Phase 2 — Tenant profile redesign (`src/routes/tenant/profile.tsx`)

- View mode: avatar (photos[0]), photo gallery grid, info card with all fields, "Editar" button.
- Edit mode (toggled): all fields editable, ImageUploader multi for photos (folder `profiles/{userId}`, min 1), single uploader for `work_certificate_url`, checkbox for `credit_auth` (locks after acceptance, shows date).
- New fields: `employer`, `work_certificate_url`, `credit_auth(_date)`, `photos`.
- Save sets `profile_photo_url = photos[0]`.

## Phase 3 — Owner profile redesign (`src/routes/owner/profile.tsx`)

- Same view/edit pattern: avatar, name/email/phone/company_name/tax_id/bio, single photo uploader, save only in edit mode.

## Phase 4 — Register flow (`src/routes/register.tsx`, `src/lib/onboarding.ts`, `src/lib/store.ts`)

- Update `TenantOnboardingForm`: replace `photoUrl` → `photos: string[]`; add `employer`, `workCertificateUrl`, `creditAuth`.
- `validateTenantStep`: require photos.length ≥ 1, nationalId, occupation.
- Register step 2 (tenant): multi-photo ImageUploader, new fields + checkbox.
- Register step 2 (owner): single optional photo + optional fields.
- `completeOnboarding` (tenant): upsert with `photos`, `profile_photo_url = photos[0] ?? ""`, `employer`, `work_certificate_url`, `credit_auth`, `credit_auth_date`.

## Phase 5 — Rental request redesign + autofill

- Modal: read-only summary card (photo, name, cédula, teléfono, ocupación, employer, credit auth badge). Only `message` editable.
- If profile missing or `photos` empty → block with alert linking to `/tenant/profile`.
- `addRentalRequest` in store: fetch `tenant_profiles`, validate, snapshot all profile fields into insert.

## Phase 6 — Owner rental request view

Update owner requests page: show photo gallery, full tenant profile fields (employer, work cert link, credit auth badge, bio, recommendations), message, approve/reject.

## Phase 7 — Public landing additions (`src/routes/index.tsx`)

Append three sections (preserve existing):
- **Servicios**: dark banner header + 3 cards (Propietarios, Inquilinos, Búsqueda) with image+title+bullets, then testimonial banner.
- **Sobre Nosotros**: dark hero with curved divider, 2-col Misión/Visión + red CTA.
- **FAQ**: accordion with 3 questions.

Update PublicNavbar: white bg, centered links (Inicio, Propiedades, Servicios, Sobre nosotros, ¿Tienes dudas?), right side search/phone/lang/Iniciar sesión/Contáctanos (dark filled).

## Phase 8 — Messaging

- New routes:
  - `src/routes/tenant/messages.tsx`: list sent messages, "Nueva solicitud" form (type, subject, body) → resolves owner via active contract → insert into `messages`.
  - `src/routes/owner/messages.tsx`: inbox grouped by sender, expand to read (marks read), reply via `mailto:`.
- Add "Mensajes" link with unread badge to tenant + owner sidebars in `DashboardShell`.

## Phase 9 — Email notifications

- Create `supabase/functions/send-notification/index.ts` using Resend (`RESEND_API_KEY` secret). Single function with `type` switch: rental_request, request_update, amenity_booking, booking_update, new_message, new_payment.
- Invoke from store actions inside try/catch — never blocking.
- Ask user to provide `RESEND_API_KEY` via secrets tool before deploying.

## Constraints

- No rewrites of working code (buildings/units/payments/amenities/meters/contracts).
- Keep ImageUploader component as-is.
- Use existing shadcn components and design tokens — add red accent token if missing.
- TanStack Router file structure preserved.

## Verification

After each phase: check build output. After Phase 1: confirm migrations applied. After Phase 5+8: smoke test request submission + message flow in preview. After Phase 9: trigger one notification and check function logs.

## Open question

Phase 9 requires a Resend API key. Once you approve the plan I'll request it via the secrets tool before deploying the function. Confirm you want Resend (vs Lovable's built-in email infra, which I can use instead with zero setup).
