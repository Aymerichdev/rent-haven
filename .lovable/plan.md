
# Migración Supabase → FastAPI

## Alcance confirmado

- **Se mantiene**: PostgreSQL (alojado en Supabase) + Supabase Storage (buckets existentes para imágenes).
- **Se elimina del frontend**: Supabase Auth, RLS, Realtime, Edge Functions, y toda llamada directa de `@supabase/supabase-js` a tablas.
- **Se añade**: backend FastAPI con JWT, RBAC (admin/owner/tenant), CRUDs completos, subida de archivos vía FastAPI hacia Supabase Storage (service role), Alembic migrations, Docker.
- **Datos**: empezamos de cero. Los usuarios se registran de nuevo.

## Aviso importante (limitación del entorno)

Lovable solo ejecuta el frontend (TanStack Start en Cloudflare Workers). **No puedo ejecutar FastAPI/Python dentro del preview**. Entrego:

- Toda la carpeta `backend/` lista para `docker compose up` en tu VPS.
- Frontend reescrito que apunta a `VITE_API_URL` (configurable). Mientras no tengas el backend corriendo, el preview de Lovable mostrará errores de red — es esperado.

## Estructura backend/

```text
backend/
├─ Dockerfile
├─ docker-compose.yml          # FastAPI + opcional pgAdmin
├─ requirements.txt
├─ alembic.ini
├─ .env.example                # DATABASE_URL, JWT_SECRET, SUPABASE_URL,
│                              # SUPABASE_SERVICE_KEY, SUPABASE_BUCKET, CORS_ORIGINS
├─ README.md                   # despliegue paso a paso
├─ alembic/
│  ├─ env.py
│  └─ versions/0001_init.py    # crea TODAS las tablas + enums + índices
└─ app/
   ├─ main.py                  # FastAPI app, CORS, routers, OpenAPI
   ├─ config.py                # pydantic-settings
   ├─ database.py              # SQLAlchemy async engine + session
   ├─ security.py              # bcrypt, JWT encode/decode
   ├─ deps.py                  # get_db, get_current_user, require_role
   ├─ storage.py               # cliente supabase-py (service key) para uploads
   ├─ models/                  # SQLAlchemy
   │  ├─ user.py               # users (id, email, password_hash, role, name, avatar)
   │  ├─ profile.py            # tenant_profile, owner_profile
   │  ├─ building.py
   │  ├─ unit.py
   │  ├─ amenity.py
   │  ├─ amenity_booking.py
   │  ├─ meter.py
   │  ├─ rental_request.py
   │  ├─ contract.py
   │  ├─ payment.py
   │  └─ message.py
   ├─ schemas/                 # Pydantic v2 (Create / Update / Read por entidad)
   ├─ services/                # lógica de negocio (estado pagos, validar reservas, etc.)
   └─ routers/
      ├─ auth.py               # POST /auth/register, /login, /refresh, /me, /change-password, /forgot, /reset
      ├─ users.py              # admin: list/get/update/delete usuarios
      ├─ tenant_profile.py     # GET/PUT /tenant/profile
      ├─ owner_profile.py      # GET/PUT /owner/profile
      ├─ buildings.py          # CRUD propietarios + GET público
      ├─ units.py              # CRUD owner + listado público + detalle + featured
      ├─ amenities.py          # CRUD owner + GET tenants del edificio
      ├─ bookings.py           # tenant crea, owner aprueba/rechaza, slots disponibles
      ├─ meters.py             # CRUD owner
      ├─ rental_requests.py    # tenant solicita, owner aprueba/rechaza
      ├─ contracts.py          # owner crea/finaliza, tenant ve los suyos
      ├─ payments.py           # generar mes, subir comprobante (upload), aprobar/rechazar
      ├─ messages.py           # tenant↔owner
      └─ uploads.py            # POST /uploads (multipart) → Supabase Storage → devuelve URL pública
```

### Endpoints (resumen)

Auth: `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `GET /auth/me`, `POST /auth/change-password`, `POST /auth/forgot-password`, `POST /auth/reset-password`.

Todos los recursos siguen REST: `GET/POST /resource`, `GET/PUT/DELETE /resource/{id}`. Reglas de autorización codificadas en dependencias (`require_role`, `require_owner_of`, `require_tenant_of_contract`).

Subidas: `POST /uploads` recibe `multipart/form-data` con `folder` y `file`, sube al bucket `property-images` con `supabase-py` usando service key, devuelve `{ url }`. Validación tamaño/MIME en el backend.

## Cambios en el frontend

### Eliminar / sustituir
- `src/integrations/supabase/client.ts`, `client.server.ts`, `auth-middleware.ts`, `auth-attacher.ts`, `types.ts` — borrados.
- `src/start.ts` — quitar `attachSupabaseAuth`.
- `src/routes/_authenticated/route.tsx` — reescrito sin Supabase, usa token JWT de localStorage.
- `src/lib/storage.ts` — reescrito: `POST` multipart a `/uploads` del FastAPI.
- `src/lib/store.ts` — reescrito completo: todas las funciones `hydrate`, `register`, `login`, `logout`, `markUnitRented`, etc. llaman al cliente API.
- Cada `src/routes/owner.*.tsx`, `tenant.*.tsx`, `units.*.tsx`, `admin.*.tsx`, `register.tsx`, `login.tsx`, `forgot-password.tsx`, `change-password.tsx` — sustituir `supabase.from(...)` por funciones del nuevo `src/lib/api/*`.

### Añadir
- `src/lib/api/client.ts` — fetch wrapper con base `import.meta.env.VITE_API_URL`, inyecta `Authorization: Bearer <token>`, refresca token, maneja 401.
- `src/lib/api/auth.ts`, `units.ts`, `buildings.ts`, `amenities.ts`, `bookings.ts`, `meters.ts`, `rentals.ts`, `contracts.ts`, `payments.ts`, `messages.ts`, `profiles.ts`, `users.ts`, `uploads.ts` — un módulo por recurso.
- `.env` — añadir `VITE_API_URL=http://localhost:8000` (placeholder).

### Auth en frontend
- JWT access (15 min) + refresh (7 días) en `localStorage`.
- `_authenticated/route.tsx` valida `GET /auth/me` antes de entrar.
- Sin Google OAuth (Supabase Auth queda fuera). Solo email/password como ya estaba.

## Detalles técnicos clave

- **Tablas**: 12 tablas espejo de las actuales (`users`, `tenant_profiles`, `owner_profiles`, `buildings`, `units`, `amenities`, `amenity_bookings`, `meters`, `rental_requests`, `contracts`, `payments`, `messages`) + enums (`role`, `unit_status`, `unit_type`, `payment_status`, `booking_status`, `request_status`, `contract_status`).
- **DB conexión**: el backend usa `DATABASE_URL` que apunta al Postgres de Supabase (puerto 5432 o pooler 6543). Alembic crea su propio esquema; no toca `auth.*` ni las tablas RLS existentes. Recomendación en README: crear DB separada o esquema `app` para no mezclarse con lo viejo.
- **Storage**: bucket `property-images` reutilizado. Backend usa `supabase` (Python SDK) con `SUPABASE_SERVICE_KEY` para `upload`/`remove`. Frontend nunca habla con Supabase Storage directamente.
- **CORS**: lista blanca por env `CORS_ORIGINS` (preview de Lovable + dominio prod).
- **Validación**: Pydantic v2 en todos los endpoints; errores → 422 con detalle.
- **OpenAPI**: `/docs` y `/redoc` activos.
- **Tests**: omitidos para mantener el alcance, pero el README explica cómo añadir pytest.

## Lo que NO se hace

- No se migran datos existentes ni hashes de contraseñas.
- No se mantiene Google OAuth (requería Supabase Auth o reescribir flujo OAuth en FastAPI).
- No se incluyen tests automatizados.
- No se incluyen workflows de CI/CD.

## Tamaño estimado

~45 archivos nuevos en `backend/`, ~15 archivos frontend nuevos (`src/lib/api/*`), ~20 archivos frontend reescritos. Total ≈ 80 archivos tocados en una sola entrega.

¿Apruebo y procedo?
