-- Sweet Crumbs Bakery: staff accounts and CRM access
--
-- Requires 20261020000000_initial_schema.sql. Run once in the Supabase SQL Editor.
-- Everything runs inside one transaction, so a failure leaves the database unchanged.
--
-- Security model:
--   * Staff sign in with Supabase Auth. Signing in alone grants nothing: a user is
--     staff only when an active row for them exists in public.staff_members, and
--     that table can only be written from the dashboard / SQL Editor.
--   * Roles: 'staff' can view everything and update order statuses, payment
--     statuses and custom cake request status / quotation / notes.
--     'admin' can additionally create and edit categories and products.
--   * Column-level grants limit what staff can change: e.g. an order's customer
--     details, items and subtotal can never be edited through the API.
--   * Anonymous visitors gain nothing from this migration.

begin;

-- ---------------------------------------------------------------------------
-- Private schema for helper functions (not exposed through the API)
-- ---------------------------------------------------------------------------

create schema if not exists private;
revoke all on schema private from public;
-- RLS policies run as the calling role, so it needs to reach the helpers.
grant usage on schema private to authenticated;

-- ---------------------------------------------------------------------------
-- Staff members
-- ---------------------------------------------------------------------------

create type public.staff_role as enum ('admin', 'staff');

create table public.staff_members (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null check (char_length(full_name) between 1 and 100),
  role        public.staff_role not null default 'staff',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger staff_members_set_updated_at before update on public.staff_members
  for each row execute function public.set_updated_at();

create function private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  );
$$;

create function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active and role = 'admin'
  );
$$;

revoke all on function private.is_staff() from public, anon, authenticated;
revoke all on function private.is_admin() from public, anon, authenticated;
grant execute on function private.is_staff() to authenticated;
grant execute on function private.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- Customer phone key: last 10 digits of the phone number, so "+91 98765 43210"
-- and "9876543210" are recognised as the same customer.
-- ---------------------------------------------------------------------------

alter table public.orders
  add column customer_phone_key text
  generated always as (right(regexp_replace(customer_phone, '[^0-9]', '', 'g'), 10)) stored;

alter table public.custom_cake_requests
  add column customer_phone_key text
  generated always as (right(regexp_replace(customer_phone, '[^0-9]', '', 'g'), 10)) stored;

create index orders_customer_phone_key_idx on public.orders (customer_phone_key);
create index custom_cake_requests_customer_phone_key_idx on public.custom_cake_requests (customer_phone_key);
create index orders_created_at_idx on public.orders (created_at desc);

-- ---------------------------------------------------------------------------
-- Order status history: one row whenever an order is placed or its status /
-- payment status changes. Written only by the trigger below.
-- ---------------------------------------------------------------------------

create table public.order_status_events (
  id              bigint generated always as identity primary key,
  order_id        uuid not null references public.orders (id) on delete cascade,
  status          public.order_status not null,
  payment_status  public.payment_status not null,
  changed_by      uuid references auth.users (id) on delete set null,
  changed_at      timestamptz not null default now()
);

create index order_status_events_order_id_idx on public.order_status_events (order_id, changed_at);

create function private.log_order_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT'
     or new.status is distinct from old.status
     or new.payment_status is distinct from old.payment_status then
    insert into public.order_status_events (order_id, status, payment_status, changed_by)
    values (new.id, new.status, new.payment_status, auth.uid());
  end if;
  return null;
end;
$$;

revoke all on function private.log_order_status() from public, anon, authenticated;

create trigger orders_log_status after insert or update of status, payment_status on public.orders
  for each row execute function private.log_order_status();

-- History for orders that already exist.
insert into public.order_status_events (order_id, status, payment_status, changed_at)
select id, status, payment_status, created_at from public.orders;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.staff_members enable row level security;
alter table public.order_status_events enable row level security;

create policy "Staff can view their own staff record"
  on public.staff_members for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Catalogue: staff also see inactive rows; only admins write.
create policy "Staff can view all categories"
  on public.categories for select
  to authenticated
  using ((select private.is_staff()));

create policy "Admins can create categories"
  on public.categories for insert
  to authenticated
  with check ((select private.is_admin()));

create policy "Admins can update categories"
  on public.categories for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Staff can view all products"
  on public.products for select
  to authenticated
  using ((select private.is_staff()));

create policy "Admins can create products"
  on public.products for insert
  to authenticated
  with check ((select private.is_admin()));

create policy "Admins can update products"
  on public.products for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- Orders and requests: staff read everything and update limited columns.
create policy "Staff can view orders"
  on public.orders for select
  to authenticated
  using ((select private.is_staff()));

create policy "Staff can update orders"
  on public.orders for update
  to authenticated
  using ((select private.is_staff()))
  with check ((select private.is_staff()));

create policy "Staff can view order items"
  on public.order_items for select
  to authenticated
  using ((select private.is_staff()));

create policy "Staff can view order status history"
  on public.order_status_events for select
  to authenticated
  using ((select private.is_staff()));

create policy "Staff can view custom cake requests"
  on public.custom_cake_requests for select
  to authenticated
  using ((select private.is_staff()));

create policy "Staff can update custom cake requests"
  on public.custom_cake_requests for update
  to authenticated
  using ((select private.is_staff()))
  with check ((select private.is_staff()));

-- ---------------------------------------------------------------------------
-- Table privileges. RLS decides which rows; these decide which columns.
-- anon gets nothing new.
-- ---------------------------------------------------------------------------

-- Leftovers from Supabase's default grants that the API roles never need.
revoke references, trigger, truncate on public.categories, public.products from anon, authenticated;

revoke all on public.staff_members, public.order_status_events from anon, authenticated;
grant select on public.staff_members, public.order_status_events to authenticated;

grant insert (slug, name, tagline, image_url, sort_order, is_active),
      update (slug, name, tagline, image_url, sort_order, is_active)
  on public.categories to authenticated;

grant insert (category_id, slug, name, description, price, unit, image_url, is_featured, is_active, is_available, sort_order),
      update (category_id, slug, name, description, price, unit, image_url, is_featured, is_active, is_available, sort_order)
  on public.products to authenticated;

grant select on public.orders, public.order_items, public.custom_cake_requests to authenticated;
grant update (status, payment_status) on public.orders to authenticated;
grant update (status, quoted_price, staff_notes) on public.custom_cake_requests to authenticated;

-- ---------------------------------------------------------------------------
-- Customers: derived from orders and custom cake requests, grouped by phone.
-- security_invoker makes the view obey the RLS of the underlying tables, so
-- only staff see any rows.
-- ---------------------------------------------------------------------------

create view public.customer_summaries
with (security_invoker = true)
as
select
  c.customer_phone_key                                                          as phone_key,
  (array_agg(c.customer_name order by c.created_at desc))[1]                    as customer_name,
  (array_agg(c.customer_phone order by c.created_at desc))[1]                   as customer_phone,
  (array_agg(c.customer_email order by c.created_at desc)
     filter (where c.customer_email is not null))[1]                            as customer_email,
  count(*) filter (where c.kind = 'order')                                      as order_count,
  count(*) filter (where c.kind = 'custom_request')                             as custom_request_count,
  coalesce(sum(c.amount) filter (where c.kind = 'order' and c.status <> 'cancelled'), 0)::numeric(12, 2)
                                                                                as total_order_value,
  min(c.created_at)                                                             as first_seen_at,
  max(c.created_at)                                                             as last_seen_at
from (
  select 'order' as kind, customer_phone_key, customer_name, customer_phone, customer_email,
         subtotal as amount, status::text as status, created_at
  from public.orders
  union all
  select 'custom_request', customer_phone_key, customer_name, customer_phone, customer_email,
         null, status::text, created_at
  from public.custom_cake_requests
) c
group by c.customer_phone_key;

revoke all on public.customer_summaries from public, anon, authenticated;
grant select on public.customer_summaries to authenticated;

-- ---------------------------------------------------------------------------
-- Dashboard figures, calculated in the database so they stay correct however
-- many orders there are. Runs as the caller (RLS applies) and refuses non-staff.
-- Dates use India time.
-- ---------------------------------------------------------------------------

create function public.admin_dashboard_stats()
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_today       date := (now() at time zone 'Asia/Kolkata')::date;
  v_month_start date := date_trunc('month', (now() at time zone 'Asia/Kolkata'))::date;
  v_orders      jsonb;
  v_by_status   jsonb;
  v_daily       jsonb;
  v_requests    jsonb;
  v_req_status  jsonb;
begin
  if not private.is_staff() then
    raise exception 'Not authorised' using errcode = '42501';
  end if;

  select jsonb_build_object(
           'total',               count(*),
           'today',               count(*) filter (where (o.created_at at time zone 'Asia/Kolkata')::date = v_today),
           'pending',             count(*) filter (where o.status = 'pending'),
           'open',                count(*) filter (where o.status not in ('completed', 'cancelled')),
           'paid_revenue',        coalesce(sum(o.subtotal) filter (where o.payment_status = 'paid'), 0),
           'paid_revenue_month',  coalesce(sum(o.subtotal) filter (
                                    where o.payment_status = 'paid'
                                      and (o.created_at at time zone 'Asia/Kolkata')::date >= v_month_start), 0),
           'unpaid_open_value',   coalesce(sum(o.subtotal) filter (
                                    where o.payment_status = 'unpaid' and o.status <> 'cancelled'), 0),
           'average_order_value', coalesce(round(avg(o.subtotal) filter (where o.status <> 'cancelled'), 2), 0)
         )
    into v_orders
  from public.orders o;

  select coalesce(jsonb_object_agg(s.status, s.n), '{}'::jsonb)
    into v_by_status
  from (select status, count(*) as n from public.orders group by status) s;

  select jsonb_agg(jsonb_build_object('date', d.day, 'orders', coalesce(x.n, 0), 'value', coalesce(x.value, 0)) order by d.day)
    into v_daily
  from (select g::date as day from generate_series(v_today - 13, v_today, interval '1 day') as g) d
  left join (
    select (created_at at time zone 'Asia/Kolkata')::date as day, count(*) as n, sum(subtotal) as value
    from public.orders
    where status <> 'cancelled'
      and (created_at at time zone 'Asia/Kolkata')::date >= v_today - 13
    group by 1
  ) x on x.day = d.day;

  select jsonb_build_object(
           'total',          count(*),
           'new',            count(*) filter (where r.status = 'new'),
           'awaiting_reply', count(*) filter (where r.status in ('new', 'contacted')),
           'upcoming_7_days', count(*) filter (
                               where r.event_date between v_today and v_today + 7
                                 and r.status not in ('declined', 'cancelled', 'completed')),
           'quoted_value',   coalesce(sum(r.quoted_price) filter (where r.status in ('quoted', 'confirmed')), 0)
         )
    into v_requests
  from public.custom_cake_requests r;

  select coalesce(jsonb_object_agg(s.status, s.n), '{}'::jsonb)
    into v_req_status
  from (select status, count(*) as n from public.custom_cake_requests group by status) s;

  return jsonb_build_object(
    'orders', v_orders || jsonb_build_object('by_status', v_by_status, 'daily', v_daily),
    'custom_requests', v_requests || jsonb_build_object('by_status', v_req_status),
    'generated_at', now()
  );
end;
$$;

revoke all on function public.admin_dashboard_stats() from public, anon, authenticated;
grant execute on function public.admin_dashboard_stats() to authenticated;

commit;

-- ---------------------------------------------------------------------------
-- After running: add your first admin (not part of the migration).
--   1. Dashboard -> Authentication -> Users -> Add user (email + password,
--      tick "Auto Confirm User").
--   2. Run, with that email and a display name:
--
--   insert into public.staff_members (user_id, full_name, role)
--   select id, 'Bakery Owner', 'admin' from auth.users where email = 'owner@example.com';
-- ---------------------------------------------------------------------------
