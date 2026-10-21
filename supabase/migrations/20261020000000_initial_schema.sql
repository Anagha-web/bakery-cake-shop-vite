-- Sweet Crumbs Bakery: initial schema
--
-- Run once, on a project that does not have these tables yet, in the Supabase SQL Editor.
-- Everything runs inside one transaction, so a failure leaves the database unchanged.
--
-- Security model (no Supabase Auth yet):
--   * categories / products: anyone can read active rows; nobody but the dashboard
--     (postgres / service_role) can write them.
--   * orders / order_items / custom_cake_requests: no direct table access for the
--     public API roles at all. Customers create rows only through the two
--     SECURITY DEFINER functions below, which validate input, look up prices
--     server-side and force the initial status. Nobody can read them back through
--     the public API; staff use the Supabase dashboard.

begin;

-- ---------------------------------------------------------------------------
-- Enum types
-- ---------------------------------------------------------------------------

create type public.order_status as enum (
  'pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'completed', 'cancelled'
);

create type public.payment_status as enum ('unpaid', 'paid', 'refunded');

create type public.fulfillment_type as enum ('pickup', 'delivery');

create type public.custom_request_status as enum (
  'new', 'contacted', 'quoted', 'confirmed', 'completed', 'declined', 'cancelled'
);

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name        text not null unique check (char_length(name) between 1 and 60),
  tagline     text check (char_length(tagline) <= 120),
  image_url   text check (image_url ~ '^https://'),
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.products (
  id           uuid primary key default gen_random_uuid(),
  category_id  uuid not null references public.categories (id) on delete restrict,
  slug         text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name         text not null check (char_length(name) between 1 and 120),
  description  text check (char_length(description) <= 1000),
  price        numeric(10, 2) not null check (price >= 0),
  unit         text not null check (char_length(unit) between 1 and 40),
  image_url    text check (image_url ~ '^https://'),
  is_featured  boolean not null default false,
  -- is_active: listed on the site at all. is_available: can be ordered right now.
  is_active    boolean not null default true,
  is_available boolean not null default true,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.orders (
  id                uuid primary key default gen_random_uuid(),
  order_number      bigint generated always as identity (start with 1001) unique,
  customer_name     text not null check (char_length(customer_name) between 1 and 100),
  customer_phone    text not null check (customer_phone ~ '^\+?[0-9][0-9 ()-]{6,19}$'),
  customer_email    text check (customer_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(customer_email) <= 254),
  fulfillment_type  public.fulfillment_type not null default 'pickup',
  delivery_address  text check (char_length(delivery_address) <= 500),
  requested_for     timestamptz,
  notes             text check (char_length(notes) <= 1000),
  subtotal          numeric(10, 2) not null check (subtotal >= 0),
  currency          char(3) not null default 'INR',
  status            public.order_status not null default 'pending',
  payment_status    public.payment_status not null default 'unpaid',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint orders_delivery_needs_address check (
    fulfillment_type = 'pickup' or char_length(btrim(coalesce(delivery_address, ''))) > 0
  )
);

create table public.order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders (id) on delete cascade,
  -- Nullable so a product can be removed later without losing order history;
  -- the name/unit/price snapshot below keeps the line readable.
  product_id    uuid references public.products (id) on delete set null,
  product_name  text not null,
  unit          text not null,
  unit_price    numeric(10, 2) not null check (unit_price >= 0),
  quantity      integer not null check (quantity between 1 and 50),
  line_total    numeric(10, 2) generated always as (unit_price * quantity) stored,
  created_at    timestamptz not null default now(),
  unique (order_id, product_id)
);

create table public.custom_cake_requests (
  id                uuid primary key default gen_random_uuid(),
  request_number    bigint generated always as identity (start with 5001) unique,
  customer_name     text not null check (char_length(customer_name) between 1 and 100),
  customer_phone    text not null check (customer_phone ~ '^\+?[0-9][0-9 ()-]{6,19}$'),
  customer_email    text check (customer_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(customer_email) <= 254),
  event_date        date not null,
  occasion          text check (char_length(occasion) <= 100),
  flavour           text check (char_length(flavour) <= 100),
  weight_kg         numeric(4, 1) check (weight_kg between 0.5 and 20),
  servings          integer check (servings between 1 and 500),
  tiers             smallint not null default 1 check (tiers between 1 and 6),
  is_eggless        boolean not null default false,
  message_on_cake   text check (char_length(message_on_cake) <= 100),
  design_notes      text check (char_length(design_notes) <= 2000),
  budget            numeric(10, 2) check (budget >= 0),
  fulfillment_type  public.fulfillment_type not null default 'pickup',
  delivery_address  text check (char_length(delivery_address) <= 500),
  status            public.custom_request_status not null default 'new',
  quoted_price      numeric(10, 2) check (quoted_price >= 0),
  staff_notes       text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint custom_requests_delivery_needs_address check (
    fulfillment_type = 'pickup' or char_length(btrim(coalesce(delivery_address, ''))) > 0
  )
);

-- ---------------------------------------------------------------------------
-- Indexes (foreign keys and common dashboard filters)
-- ---------------------------------------------------------------------------

create index products_category_id_idx on public.products (category_id);
create index order_items_order_id_idx on public.order_items (order_id);
create index order_items_product_id_idx on public.order_items (product_id);
create index orders_status_created_at_idx on public.orders (status, created_at desc);
create index custom_cake_requests_status_event_date_idx on public.custom_cake_requests (status, event_date);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

create trigger categories_set_updated_at before update on public.categories
  for each row execute function public.set_updated_at();
create trigger products_set_updated_at before update on public.products
  for each row execute function public.set_updated_at();
create trigger orders_set_updated_at before update on public.orders
  for each row execute function public.set_updated_at();
create trigger custom_cake_requests_set_updated_at before update on public.custom_cake_requests
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.custom_cake_requests enable row level security;

-- Public catalogue: read-only, active rows only.
create policy "Anyone can view active categories"
  on public.categories for select
  to anon, authenticated
  using (is_active);

create policy "Anyone can view active products"
  on public.products for select
  to anon, authenticated
  using (is_active);

-- orders, order_items and custom_cake_requests intentionally have NO policies:
-- with RLS enabled, that denies every select/insert/update/delete from the
-- public API roles. The dashboard (postgres) and service_role bypass RLS.

-- Defence in depth: grant only SELECT on the catalogue and remove the other
-- table privileges Supabase grants by default, so access stays closed even if
-- a permissive policy is added by mistake.
revoke insert, update, delete, truncate on public.categories, public.products from anon, authenticated;
grant select on public.categories, public.products to anon, authenticated;
revoke all on public.orders, public.order_items, public.custom_cake_requests from anon, authenticated;

-- ---------------------------------------------------------------------------
-- place_order: the only way the public site can create an order.
--   * Prices, names and units come from the products table, never the client.
--   * Status is always 'pending' and payment_status 'unpaid'.
--   * Returns only the new order's number and subtotal, nothing else.
-- p_items format: [{"product_id": "<uuid>", "quantity": 2}, ...]
-- ---------------------------------------------------------------------------

create function public.place_order(
  p_customer_name     text,
  p_customer_phone    text,
  p_items             jsonb,
  p_customer_email    text default null,
  p_fulfillment_type  public.fulfillment_type default 'pickup',
  p_delivery_address  text default null,
  p_requested_for     timestamptz default null,
  p_notes             text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_line_count    integer;
  v_found_count   integer;
  v_quantities_ok boolean;
  v_subtotal      numeric(10, 2);
  v_order_id      uuid;
  v_order_number  bigint;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Order must contain at least one item' using errcode = '22023';
  end if;

  if jsonb_array_length(p_items) > 30 then
    raise exception 'Order has too many lines' using errcode = '22023';
  end if;

  -- Check each submitted line on its own, before duplicates are merged, so
  -- negative or zero quantities cannot cancel out other lines.
  if exists (
    select 1
    from jsonb_array_elements(p_items) as item
    where case
      when jsonb_typeof(item) <> 'object' then true
      when coalesce(jsonb_typeof(item -> 'quantity'), '') <> 'number' then true
      else (item ->> 'quantity')::numeric not between 1 and 50
        or (item ->> 'quantity')::numeric <> trunc((item ->> 'quantity')::numeric)
    end
  ) then
    raise exception 'Each quantity must be a whole number between 1 and 50' using errcode = '22023';
  end if;

  if p_requested_for is not null
     and (p_requested_for < now() or p_requested_for > now() + interval '60 days') then
    raise exception 'Requested time must be within the next 60 days' using errcode = '22023';
  end if;

  -- Merge duplicate lines, then check every product exists, is orderable,
  -- and every quantity is within limits.
  with requested as (
    select (item ->> 'product_id')::uuid as product_id,
           sum((item ->> 'quantity')::integer) as quantity
    from jsonb_array_elements(p_items) as item
    group by 1
  )
  select count(*),
         count(p.id),
         bool_and(r.quantity between 1 and 50),
         sum(p.price * r.quantity)
    into v_line_count, v_found_count, v_quantities_ok, v_subtotal
  from requested r
  left join public.products p
    on p.id = r.product_id and p.is_active and p.is_available;

  if v_found_count <> v_line_count then
    raise exception 'One or more products are unavailable' using errcode = '22023';
  end if;

  if v_quantities_ok is not true then
    raise exception 'Each quantity must be between 1 and 50' using errcode = '22023';
  end if;

  insert into public.orders (
    customer_name, customer_phone, customer_email, fulfillment_type,
    delivery_address, requested_for, notes, subtotal
  )
  values (
    btrim(p_customer_name),
    btrim(p_customer_phone),
    nullif(btrim(p_customer_email), ''),
    p_fulfillment_type,
    nullif(btrim(p_delivery_address), ''),
    p_requested_for,
    nullif(btrim(p_notes), ''),
    v_subtotal
  )
  returning id, order_number into v_order_id, v_order_number;

  insert into public.order_items (order_id, product_id, product_name, unit, unit_price, quantity)
  select v_order_id, p.id, p.name, p.unit, p.price, r.quantity
  from (
    select (item ->> 'product_id')::uuid as product_id,
           sum((item ->> 'quantity')::integer) as quantity
    from jsonb_array_elements(p_items) as item
    group by 1
  ) r
  join public.products p on p.id = r.product_id;

  return jsonb_build_object('order_number', v_order_number, 'subtotal', v_subtotal);
end;
$$;

-- ---------------------------------------------------------------------------
-- submit_custom_cake_request: the only way the public site can create a
-- custom cake request. Status is always 'new'; quoted_price and staff_notes
-- can only be set by staff. Enforces the 48-hour lead time shown on the site.
-- ---------------------------------------------------------------------------

create function public.submit_custom_cake_request(
  p_customer_name     text,
  p_customer_phone    text,
  p_event_date        date,
  p_customer_email    text default null,
  p_occasion          text default null,
  p_flavour           text default null,
  p_weight_kg         numeric default null,
  p_servings          integer default null,
  p_tiers             smallint default 1,
  p_is_eggless        boolean default false,
  p_message_on_cake   text default null,
  p_design_notes      text default null,
  p_budget            numeric default null,
  p_fulfillment_type  public.fulfillment_type default 'pickup',
  p_delivery_address  text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_today          date := (now() at time zone 'Asia/Kolkata')::date;
  v_request_number bigint;
begin
  if p_event_date is null or p_event_date < v_today + 2 or p_event_date > v_today + 365 then
    raise exception 'Event date must be at least 2 days and at most 1 year away' using errcode = '22023';
  end if;

  insert into public.custom_cake_requests (
    customer_name, customer_phone, customer_email, event_date, occasion, flavour,
    weight_kg, servings, tiers, is_eggless, message_on_cake, design_notes, budget,
    fulfillment_type, delivery_address
  )
  values (
    btrim(p_customer_name),
    btrim(p_customer_phone),
    nullif(btrim(p_customer_email), ''),
    p_event_date,
    nullif(btrim(p_occasion), ''),
    nullif(btrim(p_flavour), ''),
    p_weight_kg,
    p_servings,
    coalesce(p_tiers, 1),
    coalesce(p_is_eggless, false),
    nullif(btrim(p_message_on_cake), ''),
    nullif(btrim(p_design_notes), ''),
    p_budget,
    p_fulfillment_type,
    nullif(btrim(p_delivery_address), '')
  )
  returning request_number into v_request_number;

  return jsonb_build_object('request_number', v_request_number);
end;
$$;

-- Function privileges: only the two customer-facing functions are callable
-- through the API; the trigger helper is not.
revoke all on function public.set_updated_at() from public, anon, authenticated;

revoke all on function public.place_order(text, text, jsonb, text, public.fulfillment_type, text, timestamptz, text)
  from public, anon, authenticated;
grant execute on function public.place_order(text, text, jsonb, text, public.fulfillment_type, text, timestamptz, text)
  to anon, authenticated;

revoke all on function public.submit_custom_cake_request(text, text, date, text, text, text, numeric, integer, smallint, boolean, text, text, numeric, public.fulfillment_type, text)
  from public, anon, authenticated;
grant execute on function public.submit_custom_cake_request(text, text, date, text, text, text, numeric, integer, smallint, boolean, text, text, numeric, public.fulfillment_type, text)
  to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Seed data: the current menu from src/data/products.ts.
-- Slugs match the existing frontend product ids. Delete this section if you
-- would rather enter the catalogue through the dashboard.
-- ---------------------------------------------------------------------------

insert into public.categories (slug, name, tagline, image_url, sort_order) values
  ('cakes',    'Cakes',    'Celebration & everyday', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=500&q=80', 1),
  ('cupcakes', 'Cupcakes', 'Little bites of joy',    'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?auto=format&fit=crop&w=500&q=80', 2),
  ('pastries', 'Pastries', 'Flaky & buttery',        'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=500&q=80', 3),
  ('cookies',  'Cookies',  'Baked golden daily',     'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=500&q=80', 4),
  ('breads',   'Breads',   'Slow-fermented loaves',  'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=500&q=80', 5);

insert into public.products (category_id, slug, name, description, price, unit, image_url, is_featured, sort_order)
select c.id, v.slug, v.name, v.description, v.price, v.unit,
       'https://images.unsplash.com/photo-' || v.photo || '?auto=format&fit=crop&w=800&q=80',
       v.is_featured, v.sort_order
from (values
  ('cakes',    'belgian-truffle-cake',  'Belgian Chocolate Truffle Cake', 'Rich chocolate sponge layered with silky Belgian ganache.',     1299, '1 kg',       '1578985545062-69928b1d9587', true,  1),
  ('cakes',    'strawberry-cream-cake', 'Strawberry Cream Cake',          'Vanilla sponge, fresh strawberries and light whipped cream.',  1149, '1 kg',       '1565958011703-44f9829ba187', true,  2),
  ('cakes',    'pink-velvet-cake',      'Pink Velvet Celebration Cake',   'Funfetti layers with pink buttercream drip and sprinkles.',    1499, '1 kg',       '1621303837174-89787a7d4729', true,  3),
  ('cupcakes', 'strawberry-cupcakes',   'Strawberry Swirl Cupcakes',      'Soft vanilla cupcakes topped with strawberry frosting.',        449, 'Box of 6',   '1563729784474-d77dbb933a9e', false, 4),
  ('cupcakes', 'hazelnut-cupcakes',     'Chocolate Hazelnut Cupcakes',    'Dark chocolate cupcakes with hazelnut praline frosting.',       499, 'Box of 6',   '1550617931-e17a7b70dce2',    false, 5),
  ('pastries', 'butter-croissants',     'Classic Butter Croissants',      'Hand-laminated, golden and flaky with pure butter.',            299, 'Pack of 4',  '1555507036-ab1f4038808a',    false, 6),
  ('pastries', 'tiramisu-pastry',       'Tiramisu Pastry',                'Coffee-soaked sponge with mascarpone cream and cocoa.',         189, '1 slice',    '1571115177098-24ec42ed204d', false, 7),
  ('cookies',  'choco-chip-cookies',    'Choco Chip Cookies',             'Chewy centres, crisp edges and plenty of chocolate chunks.',    249, 'Pack of 10', '1558961363-fa8fdf82db35',    false, 8),
  ('breads',   'sourdough-loaf',        'Artisan Sourdough Loaf',         '24-hour fermented sourdough with a crackly crust.',             229, '500 g',      '1509440159596-0249088772ff', false, 9),
  ('breads',   'multigrain-loaf',       'Multigrain Sandwich Loaf',       'Wholesome sliced loaf with oats, seeds and whole wheat.',       149, '400 g',      '1549931319-a545dcf3bc73',    false, 10)
) as v (category_slug, slug, name, description, price, unit, photo, is_featured, sort_order)
join public.categories c on c.slug = v.category_slug;

commit;
