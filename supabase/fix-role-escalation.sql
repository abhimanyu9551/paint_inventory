-- CRITICAL security fix: removes a policy that let any authenticated user
-- rewrite their own `profiles.role` column (self-promote to admin), since
-- RLS is row-level and the old policy only checked row ownership, not which
-- columns changed. See supabase/schema.sql for the full explanation.
--
-- Run this once in the Supabase Dashboard: SQL Editor -> New query -> paste -> Run

drop policy if exists "users can update their own profile" on public.profiles;
