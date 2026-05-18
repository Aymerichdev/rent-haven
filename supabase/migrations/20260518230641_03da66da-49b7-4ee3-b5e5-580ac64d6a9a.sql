
-- ENUM
create type public.app_role as enum ('admin', 'owner', 'tenant');

-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text not null,
  role public.app_role not null default 'tenant',
  avatar text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = _user_id and role = _role)
$$;

create policy "profiles_select_auth" on public.profiles for select to authenticated using (true);
create policy "profiles_update_self" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles_admin_all" on public.profiles for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "profiles_insert_self" on public.profiles for insert to authenticated with check (id = auth.uid());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id, new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
    coalesce((new.raw_user_meta_data->>'role')::public.app_role, 'tenant')
  ) on conflict (id) do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- BUILDINGS
create table public.buildings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null, address text not null, city text not null,
  description text, images text[] not null default '{}'
);
alter table public.buildings enable row level security;
create policy "buildings_select_all" on public.buildings for select to anon, authenticated using (true);
create policy "buildings_owner_write" on public.buildings for all to authenticated
  using (owner_id = auth.uid() or public.has_role(auth.uid(),'admin'))
  with check (owner_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- AMENITIES
create table public.amenities (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings(id) on delete cascade,
  name text not null, icon text not null default '',
  bookable boolean not null default false,
  description text, photo_url text, capacity int, schedule jsonb
);
alter table public.amenities enable row level security;
create policy "amenities_select_all" on public.amenities for select to anon, authenticated using (true);
create policy "amenities_owner_write" on public.amenities for all to authenticated
  using (exists (select 1 from public.buildings b where b.id = building_id and (b.owner_id = auth.uid() or public.has_role(auth.uid(),'admin'))))
  with check (exists (select 1 from public.buildings b where b.id = building_id and (b.owner_id = auth.uid() or public.has_role(auth.uid(),'admin'))));

-- UNITS
create table public.units (
  id uuid primary key default gen_random_uuid(),
  building_id uuid references public.buildings(id) on delete set null,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  number text not null default '', title text not null,
  description text not null default '',
  type text not null check (type in ('apartment','house','studio')),
  images text[] not null default '{}',
  bedrooms int not null default 0, bathrooms int not null default 0,
  area numeric not null default 0, rent numeric not null default 0,
  status text not null default 'available' check (status in ('available','rented','maintenance')),
  tenant_id uuid references public.profiles(id) on delete set null,
  featured boolean not null default false,
  address_override text, city_override text
);
alter table public.units enable row level security;
create policy "units_select_all" on public.units for select to anon, authenticated using (true);
create policy "units_owner_write" on public.units for all to authenticated
  using (owner_id = auth.uid() or public.has_role(auth.uid(),'admin'))
  with check (owner_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- METERS
create table public.meters (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units(id) on delete cascade,
  type text not null check (type in ('water','electricity','gas')),
  reading numeric not null, date date not null default current_date
);
alter table public.meters enable row level security;
create policy "meters_select" on public.meters for select to authenticated
  using (exists (select 1 from public.units u where u.id = unit_id and (u.owner_id = auth.uid() or u.tenant_id = auth.uid() or public.has_role(auth.uid(),'admin'))));
create policy "meters_write" on public.meters for all to authenticated
  using (exists (select 1 from public.units u where u.id = unit_id and (u.owner_id = auth.uid() or public.has_role(auth.uid(),'admin'))))
  with check (exists (select 1 from public.units u where u.id = unit_id and (u.owner_id = auth.uid() or public.has_role(auth.uid(),'admin'))));

-- RENTAL REQUESTS (with snapshot fields)
create table public.rental_requests (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units(id) on delete cascade,
  tenant_id uuid not null references public.profiles(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  phone text not null default '', message text not null default '',
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  owner_response text,
  national_id text, occupation text, bio text, recommendations text,
  profile_photo_url text, photos text[] default '{}',
  employer text, work_certificate_url text, credit_auth boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);
alter table public.rental_requests enable row level security;
create policy "rr_select" on public.rental_requests for select to authenticated
  using (tenant_id = auth.uid() or owner_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "rr_insert" on public.rental_requests for insert to authenticated with check (tenant_id = auth.uid());
create policy "rr_update_owner" on public.rental_requests for update to authenticated
  using (owner_id = auth.uid() or public.has_role(auth.uid(),'admin'))
  with check (owner_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- AMENITY BOOKINGS
create table public.amenity_bookings (
  id uuid primary key default gen_random_uuid(),
  amenity_id uuid not null references public.amenities(id) on delete cascade,
  tenant_id uuid not null references public.profiles(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  date date not null, start_time time not null, end_time time not null,
  notes text, owner_note text,
  status text not null default 'pending' check (status in ('pending','approved','rejected'))
);
alter table public.amenity_bookings enable row level security;
create policy "ab_select" on public.amenity_bookings for select to authenticated
  using (tenant_id = auth.uid() or owner_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "ab_insert" on public.amenity_bookings for insert to authenticated with check (tenant_id = auth.uid());
create policy "ab_update_owner" on public.amenity_bookings for update to authenticated
  using (owner_id = auth.uid() or public.has_role(auth.uid(),'admin'))
  with check (owner_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- CONTRACTS
create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units(id) on delete cascade,
  tenant_id uuid references public.profiles(id) on delete set null,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  start_date date not null, end_date date not null,
  monthly_rent numeric not null, deposit numeric not null default 0,
  status text not null default 'active' check (status in ('active','ended')),
  contract_photo_url text
);
alter table public.contracts enable row level security;
create policy "contracts_select" on public.contracts for select to authenticated
  using (tenant_id = auth.uid() or owner_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "contracts_owner_write" on public.contracts for all to authenticated
  using (owner_id = auth.uid() or public.has_role(auth.uid(),'admin'))
  with check (owner_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- PAYMENTS
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  tenant_id uuid not null references public.profiles(id) on delete cascade,
  month text not null, amount numeric not null,
  utilities numeric not null default 0,
  status text not null default 'pending' check (status in ('pending','paid','overdue','validating','rejected')),
  paid_at date, receipt_url text, receipt_name text, receipt_type text,
  receipt_uploaded_at timestamptz, owner_note text, reviewed_at timestamptz
);
alter table public.payments enable row level security;
create policy "pay_select" on public.payments for select to authenticated
  using (tenant_id = auth.uid() or exists (select 1 from public.contracts c where c.id = contract_id and c.owner_id = auth.uid()) or public.has_role(auth.uid(),'admin'));
create policy "pay_write" on public.payments for all to authenticated
  using (exists (select 1 from public.contracts c where c.id = contract_id and (c.owner_id = auth.uid() or c.tenant_id = auth.uid())) or public.has_role(auth.uid(),'admin'))
  with check (exists (select 1 from public.contracts c where c.id = contract_id and (c.owner_id = auth.uid() or c.tenant_id = auth.uid())) or public.has_role(auth.uid(),'admin'));

-- TENANT / OWNER profiles
create table public.tenant_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  phone text not null default '',
  national_id text not null default '',
  occupation text not null default '',
  bio text, recommendations text,
  profile_photo_url text,
  photos text[] default '{}',
  employer text, work_certificate_url text,
  credit_auth boolean default false, credit_auth_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);
create table public.owner_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  phone text not null default '',
  company_name text, tax_id text, bio text, profile_photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);
alter table public.tenant_profiles enable row level security;
alter table public.owner_profiles enable row level security;

create policy "tp_select" on public.tenant_profiles for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin') or exists (select 1 from public.rental_requests r where r.tenant_id = public.tenant_profiles.id and r.owner_id = auth.uid()));
create policy "tp_insert" on public.tenant_profiles for insert to authenticated with check (id = auth.uid());
create policy "tp_update" on public.tenant_profiles for update to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin')) with check (id = auth.uid() or public.has_role(auth.uid(),'admin'));

create policy "op_select" on public.owner_profiles for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "op_insert" on public.owner_profiles for insert to authenticated with check (id = auth.uid());
create policy "op_update" on public.owner_profiles for update to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin')) with check (id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- MESSAGES
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid references public.contracts(id) on delete cascade,
  sender_id uuid references public.profiles(id),
  receiver_id uuid references public.profiles(id),
  subject text not null,
  body text not null,
  type text default 'general' check (type in ('general','maintenance','payment','complaint','other')),
  read boolean default false,
  created_at timestamptz default now()
);
alter table public.messages enable row level security;
create policy "messages_select" on public.messages for select to authenticated using (sender_id = auth.uid() or receiver_id = auth.uid());
create policy "messages_insert" on public.messages for insert to authenticated with check (sender_id = auth.uid());
create policy "messages_update" on public.messages for update to authenticated using (receiver_id = auth.uid());

-- STORAGE bucket for property images / profile photos / receipts
insert into storage.buckets (id, name, public) values ('property-images','property-images', true) on conflict (id) do nothing;
create policy "property_images_read" on storage.objects for select to anon, authenticated using (bucket_id = 'property-images');
create policy "property_images_write" on storage.objects for insert to authenticated with check (bucket_id = 'property-images');
create policy "property_images_update" on storage.objects for update to authenticated using (bucket_id = 'property-images');
create policy "property_images_delete" on storage.objects for delete to authenticated using (bucket_id = 'property-images');
