# BR Internacional — FastAPI backend

Reemplaza Supabase Auth + PostgREST + RLS por un servicio FastAPI propio.
Mantiene **Supabase Storage** (buckets) y **PostgreSQL** (puede ser el de Supabase u otro).

## Stack

- FastAPI + Pydantic v2
- SQLAlchemy 2 + Alembic
- JWT (access 60 min + refresh 7 días)
- Autorización por rol (`admin`, `owner`, `tenant`) — equivalente a las viejas policies RLS
- Subidas de archivos a Supabase Storage (service role)

## Endpoints

- `POST /auth/register` `{email, password, name, role}` → `{access_token, refresh_token, user}`
- `POST /auth/login`
- `POST /auth/refresh` `{refresh_token}`
- `GET  /auth/me`
- `PATCH /auth/me` `{password?, name?, avatar?}`
- `POST /auth/logout`
- `POST /auth/reset-password` (stub — añade tu SMTP para hacerlo real)

API REST compatible con PostgREST (lo que ya usa el frontend):
- `GET /rest/{table}?col=eq.val&order=col.desc&limit=10`
- `GET /rest/{table}?…` con header `Accept: application/vnd.pgrst.object+json` → objeto único
- `POST /rest/{table}` (body objeto o lista). Upsert: header `Prefer: resolution=merge-duplicates`
- `PATCH /rest/{table}?col=eq.val` body parcial
- `DELETE /rest/{table}?col=eq.val`

Storage:
- `POST /storage/upload` `multipart` (`folder`, `file`) → `{url, path}`
- `DELETE /storage/object?path=…`
- `GET /storage/list?folder=…`
- `GET /storage/public-url?path=…`

Tablas: `profiles`, `tenant_profiles`, `owner_profiles`, `buildings`, `units`,
`amenities`, `amenity_bookings`, `meters`, `rental_requests`, `contracts`,
`payments`, `messages`.

OpenAPI: `/docs` y `/redoc`.

## Despliegue rápido (VPS con Docker)

```bash
cd backend
cp .env.example .env
# Edita .env: DATABASE_URL (Postgres), JWT_SECRET, SUPABASE_SERVICE_KEY, CORS_ORIGINS
docker compose up -d --build
docker compose logs -f api
```

La primera vez Alembic crea todas las tablas. Para futuras migraciones:

```bash
docker compose exec api alembic revision --autogenerate -m "mi cambio"
docker compose exec api alembic upgrade head
```

### DATABASE_URL

Si usas el Postgres de Supabase, en el dashboard de Supabase ve a
**Project Settings → Database → Connection string → URI** y reemplaza
`postgresql://` por `postgresql+psycopg2://`. Recomendado: crear un schema
separado o una base de datos limpia para no mezclar con `auth.*` y las
tablas RLS antiguas (estas tablas no se tocan; este backend crea su propio
set en el schema `public`, así que **bórralas o usa otra DB** para no
chocar con nombres).

### Variables clave

| Var | Para qué |
| --- | --- |
| `DATABASE_URL` | Conexión SQLAlchemy (`postgresql+psycopg2://…`) |
| `JWT_SECRET` | Firma de tokens. **Cámbialo en prod.** |
| `CORS_ORIGINS` | Lista separada por comas con los dominios del frontend |
| `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` | Para subir/eliminar archivos en Storage |
| `SUPABASE_BUCKET` | Nombre del bucket (por defecto `property-images`) |

### Frontend

En el `.env` del frontend define:

```
VITE_API_URL=https://tu-backend.example.com
```

(En desarrollo local: `http://localhost:8000`.)

## Autorización (sustituye a RLS)

Implementada en `app/authz.py`. Resumen:

| Tabla | Lectura | Escritura |
| --- | --- | --- |
| `profiles` | autenticado o admin | propio usuario / admin |
| `tenant_profiles` | propio tenant; owners y admin pueden leer | propio tenant |
| `owner_profiles` | propio owner; otros pueden leer | propio owner |
| `buildings` / `units` / `amenities` | público (units solo `available` para anónimos) | owner dueño |
| `amenity_bookings` | tenant propio / owner del amenity | tenant crea; ambos editan los suyos |
| `meters` | owner del unit / tenant del unit | owner |
| `rental_requests` | sender o receiver | tenant crea; ambos actualizan |
| `contracts` | tenant o owner del contrato | owner crea/edita |
| `payments` | tenant o owner del contrato | owner crea; ambos editan los suyos |
| `messages` | sender o receiver | sender crea; ambos editan los suyos |

Admin tiene acceso completo.

## Notas

- Los hashes de contraseñas son bcrypt; los usuarios deben registrarse de nuevo (no migramos desde Supabase Auth).
- `POST /auth/reset-password` es un stub. Conecta SMTP para enviar el email real.
- Sin Google OAuth (Supabase Auth fue retirado). Email/contraseña únicamente.
- No hay realtime; las pantallas que necesitaban "vivo" hacen polling al refrescar.
