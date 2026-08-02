-- Alnoor Paint Inventory Management System — Supabase schema
-- Run this once in the Supabase Dashboard: SQL Editor -> New query -> paste -> Run

-- ============================================================
-- Extensions
-- ============================================================
create extension if not exists "pgcrypto";

-- ============================================================
-- profiles (extends Supabase's built-in auth.users with role/name)
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null,
  role text not null default 'user' check (role in ('admin', 'supervisor', 'user')),
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', new.email),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'role', 'user')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- suppliers
-- ============================================================
create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  address text,
  lead_time_days integer not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================
-- paints
-- ============================================================
create table if not exists public.paints (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color_hex text,
  finish_type text check (finish_type in ('Matte', 'Gloss', 'Satin', 'Eggshell')),
  brand text,
  stock integer not null default 0,
  threshold integer not null default 0,
  supplier_id uuid references public.suppliers (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- stock_transactions
-- ============================================================
create table if not exists public.stock_transactions (
  id uuid primary key default gen_random_uuid(),
  paint_id uuid not null references public.paints (id) on delete cascade,
  type text not null check (type in ('ADD', 'REMOVE')),
  quantity integer not null,
  performed_by uuid references public.profiles (id) on delete set null,
  date timestamptz not null default now(),
  note text
);

-- ============================================================
-- alerts
-- ============================================================
create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  paint_id uuid not null references public.paints (id) on delete cascade,
  message text not null,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles enable row level security;
alter table public.suppliers enable row level security;
alter table public.paints enable row level security;
alter table public.stock_transactions enable row level security;
alter table public.alerts enable row level security;

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Helper: is the current user an admin or supervisor?
create or replace function public.is_admin_or_supervisor()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'supervisor')
  );
$$;

-- profiles: everyone can read all profiles (needed for "performed by" names etc.);
-- only admins can insert/update/delete profiles. There is intentionally no
-- self-update policy: RLS is row-level, not column-level, so a policy like
-- "id = auth.uid()" would let any user rewrite their own `role` column
-- (self-promote to admin) since it can't restrict which columns are touched.
-- The app has no self-service profile editing UI - all profile writes go
-- through the admin-gated updateUser Server Action. If self-service
-- name/email editing is added later, gate it with a trigger that rejects
-- any change to `role` unless the caller is an admin, not a bare RLS policy.
create policy "profiles are readable by any authenticated user"
  on public.profiles for select
  to authenticated
  using (true);

create policy "admins can manage all profiles"
  on public.profiles for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- suppliers: anyone logged in can read; only admins can add/edit/remove (matches
-- the Suppliers page, which is admin-only in the UI).
create policy "authenticated read suppliers" on public.suppliers for select to authenticated using (true);
create policy "admins insert suppliers" on public.suppliers for insert to authenticated with check (public.is_admin());
create policy "admins update suppliers" on public.suppliers for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins delete suppliers" on public.suppliers for delete to authenticated using (public.is_admin());

-- paints: anyone logged in can read. Only admins can add/remove paints. Updates stay
-- open to any authenticated user because stock adjustments (restock/consume) are
-- performed by every role, including "user" on the Consume Paint page - the
-- Server Actions in lib/actions.ts additionally restrict full paint edits
-- (name/color/finish/brand/supplier) to admins.
create policy "authenticated read paints" on public.paints for select to authenticated using (true);
create policy "admins insert paints" on public.paints for insert to authenticated with check (public.is_admin());
create policy "authenticated update paints" on public.paints for update to authenticated using (true) with check (true);
create policy "admins delete paints" on public.paints for delete to authenticated using (public.is_admin());

-- stock_transactions: an append-only audit log. Any authenticated user can read and
-- insert (restocking/consuming creates a row); nobody can edit or delete history.
create policy "authenticated read stock_transactions" on public.stock_transactions for select to authenticated using (true);
create policy "authenticated insert stock_transactions" on public.stock_transactions for insert to authenticated with check (true);

-- alerts: any authenticated user can read, and inserts happen automatically when
-- stock drops below threshold (any role can trigger that). Only admins/supervisors
-- can resolve an alert, matching the Alerts page's allowedRoles. No delete policy -
-- alerts are only ever resolved, never removed.
create policy "authenticated read alerts" on public.alerts for select to authenticated using (true);
create policy "authenticated insert alerts" on public.alerts for insert to authenticated with check (true);
create policy "admin or supervisor resolve alerts" on public.alerts for update to authenticated using (public.is_admin_or_supervisor()) with check (public.is_admin_or_supervisor());

-- ============================================================
-- adjust_stock: atomic stock adjustment (see supabase/adjust-stock-rpc.sql
-- for the full explanation). Runs the stock update, transaction insert, and
-- dedup'd low-stock alert insert as one transaction with the paint row
-- locked, instead of separate client-side calls that could race or
-- partially fail.
-- ============================================================
create or replace function public.adjust_stock(
  p_paint_id uuid,
  p_type text,
  p_quantity int,
  p_user_id uuid,
  p_note text default null
)
returns json
language plpgsql
security invoker
as $$
declare
  v_paint public.paints%rowtype;
  v_supplier public.suppliers%rowtype;
  v_new_stock int;
  v_low_stock boolean := false;
  v_message text;
  v_existing_alert_id uuid;
begin
  if p_type not in ('ADD', 'REMOVE') then
    raise exception 'Invalid type: %', p_type;
  end if;
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Quantity must be a positive number';
  end if;

  select * into v_paint from public.paints where id = p_paint_id for update;
  if not found then
    raise exception 'Paint not found';
  end if;

  if p_type = 'REMOVE' and v_paint.stock < p_quantity then
    raise exception 'Insufficient stock';
  end if;

  v_new_stock := case when p_type = 'ADD' then v_paint.stock + p_quantity else v_paint.stock - p_quantity end;

  update public.paints set stock = v_new_stock where id = p_paint_id;

  insert into public.stock_transactions (paint_id, type, quantity, performed_by, note)
  values (p_paint_id, p_type, p_quantity, p_user_id, p_note);

  if p_type = 'REMOVE' and v_new_stock <= v_paint.threshold then
    v_low_stock := true;

    select id into v_existing_alert_id
    from public.alerts
    where paint_id = p_paint_id and resolved = false
    limit 1;

    if v_existing_alert_id is null then
      select * into v_supplier from public.suppliers where id = v_paint.supplier_id;

      v_message := v_paint.name || ' stock is low (' || v_new_stock || ' units, threshold: ' || v_paint.threshold || ')';
      if v_supplier.id is not null then
        v_message := v_message || '. Contact ' || v_supplier.name || ' at ' || v_supplier.phone;
      end if;

      insert into public.alerts (paint_id, message, resolved) values (p_paint_id, v_message, false);
    end if;
  end if;

  return json_build_object(
    'newStock', v_new_stock,
    'lowStock', v_low_stock,
    'paintName', v_paint.name,
    'threshold', v_paint.threshold
  );
end;
$$;

grant execute on function public.adjust_stock(uuid, text, int, uuid, text) to authenticated;
