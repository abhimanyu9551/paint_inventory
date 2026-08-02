-- Tightens Row Level Security to match each page's actual role restrictions.
-- Run this once in the Supabase Dashboard: SQL Editor -> New query -> paste -> Run
-- Safe to run on the project you already set up from schema.sql - it only
-- replaces the old "any authenticated user can do anything" policies.

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

-- suppliers
drop policy if exists "authenticated write suppliers" on public.suppliers;
create policy "admins insert suppliers" on public.suppliers for insert to authenticated with check (public.is_admin());
create policy "admins update suppliers" on public.suppliers for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins delete suppliers" on public.suppliers for delete to authenticated using (public.is_admin());

-- paints (update stays open - see comment in schema.sql)
drop policy if exists "authenticated write paints" on public.paints;
create policy "admins insert paints" on public.paints for insert to authenticated with check (public.is_admin());
create policy "authenticated update paints" on public.paints for update to authenticated using (true) with check (true);
create policy "admins delete paints" on public.paints for delete to authenticated using (public.is_admin());

-- stock_transactions (append-only: read + insert, no update/delete)
drop policy if exists "authenticated write stock_transactions" on public.stock_transactions;
create policy "authenticated insert stock_transactions" on public.stock_transactions for insert to authenticated with check (true);

-- alerts (read + insert open; resolving restricted to admin/supervisor; no delete)
drop policy if exists "authenticated write alerts" on public.alerts;
create policy "authenticated insert alerts" on public.alerts for insert to authenticated with check (true);
create policy "admin or supervisor resolve alerts" on public.alerts for update to authenticated using (public.is_admin_or_supervisor()) with check (public.is_admin_or_supervisor());
