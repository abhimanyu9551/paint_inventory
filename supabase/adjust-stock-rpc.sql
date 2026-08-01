-- Fixes two issues in the old client-side adjustStock flow:
-- 1. HIGH: stock update + transaction insert were two separate network calls
--    with no rollback if the second failed, and no locking, so two
--    concurrent adjustments on the same paint could race and lose an update.
-- 2. MEDIUM: a new alert row was inserted on every low-stock REMOVE, even
--    when an unresolved alert for that paint already existed (duplicates).
--
-- This function runs as a single transaction with `select ... for update`
-- to lock the paint row for the duration of the adjustment, and only
-- inserts an alert if no unresolved one already exists for that paint.
-- It runs with the caller's own permissions (not security definer), so the
-- existing RLS policies on paints/stock_transactions/alerts still apply.
--
-- Run this once in the Supabase Dashboard: SQL Editor -> New query -> paste -> Run

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
