-- Role-specific onboarding tables for scalable profile data.

create table public.tenant_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  phone text not null,
  national_id text not null,
  occupation text not null,
  bio text,
  recommendations text,
  profile_photo_url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table public.owner_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  phone text not null,
  company_name text,
  tax_id text,
  bio text,
  profile_photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

alter table public.tenant_profiles enable row level security;
alter table public.owner_profiles enable row level security;

create policy "tenant_profiles_select_self" on public.tenant_profiles
  for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "tenant_profiles_insert_self" on public.tenant_profiles
  for insert to authenticated with check (id = auth.uid());
create policy "tenant_profiles_update_self" on public.tenant_profiles
  for update to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin'))
  with check (id = auth.uid() or public.has_role(auth.uid(),'admin'));

create policy "owner_profiles_select_self" on public.owner_profiles
  for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "owner_profiles_insert_self" on public.owner_profiles
  for insert to authenticated with check (id = auth.uid());
create policy "owner_profiles_update_self" on public.owner_profiles
  for update to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin'))
  with check (id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- Modificar tenant_profiles para soportar múltiples fotos y nuevos campos
ALTER TABLE public.tenant_profiles
  ADD COLUMN IF NOT EXISTS photos text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS employer text,
  ADD COLUMN IF NOT EXISTS work_certificate_url text,
  ADD COLUMN IF NOT EXISTS credit_auth boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS credit_auth_date timestamptz;

-- Hacer profile_photo_url nullable (foto principal, ahora es la primera del array)
ALTER TABLE public.tenant_profiles
  ALTER COLUMN profile_photo_url DROP NOT NULL;