-- ============================================================================
-- Barra Manager — schema completo de Supabase (Postgres)
-- Ejecutar UNA sola vez (SQL Editor de Supabase) en un proyecto nuevo.
-- Es seguro volver a correrlo: los bloques de realtime son idempotentes,
-- pero las tablas usan CREATE TABLE simple (fallará si ya existen).
-- ============================================================================

create extension if not exists "pgcrypto"; -- gen_random_uuid(), crypt() para PINs

-- ----------------------------------------------------------------------------
-- EVENTOS
-- ----------------------------------------------------------------------------
create table events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  date date not null,
  location text not null,
  description text,
  status text not null default 'BORRADOR' check (status in ('BORRADOR','ACTIVO','CERRADO')),
  order_counter integer not null default 0,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  closed_at timestamptz
);

-- Regla de negocio: solo un evento ACTIVO a la vez (índice único parcial).
create unique index events_single_active_idx on events ((status)) where status = 'ACTIVO';

-- ----------------------------------------------------------------------------
-- STAFF (login por PIN, nunca expuesto al cliente vía RLS)
-- ----------------------------------------------------------------------------
create table staff (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null check (role in ('CAJA','FRIO','CALIENTE','ADMIN')),
  pin_hash text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index staff_role_active_idx on staff(role) where active;

-- ----------------------------------------------------------------------------
-- PRODUCTOS — cada evento tiene su propia copia (nunca se toca el histórico
-- de un evento anterior al crear uno nuevo).
-- ----------------------------------------------------------------------------
create table products (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  category text not null,
  sector_economico text not null check (sector_economico in ('FRIO','CALIENTE')),
  sector_preparacion text not null check (sector_preparacion in ('FRIO','CALIENTE')),
  price numeric(12,2) not null check (price >= 0),
  track_stock boolean not null default false,
  stock_qty integer not null default 0,
  low_stock_threshold integer not null default 0,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index products_event_idx on products(event_id);

-- ----------------------------------------------------------------------------
-- PEDIDOS — el estado "BORRADOR" vive solo en el cliente (carrito local);
-- una fila en `orders` ya nace COBRADO (o luego pasa a ANULADO).
-- ----------------------------------------------------------------------------
create table orders (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  order_number integer not null,
  status text not null default 'COBRADO' check (status in ('COBRADO','ANULADO')),
  -- CORTESIA: pedidos regalados a staff/músicos (se cobran a $0), separados
  -- de la facturación real para poder reconciliarlos con el festival aparte.
  payment_method text not null check (payment_method in ('EFECTIVO','TRANSFERENCIA','DEBITO','CORTESIA')),
  total numeric(12,2) not null default 0,
  -- Etiqueta informativa del descuento aplicado (p. ej. "Feriante -20%",
  -- "Cortesía"). No afecta ningún cálculo: el precio ya descontado queda
  -- grabado en order_items.unit_price: esto es solo para mostrar en pantalla.
  discount_label text,
  created_by uuid references staff(id) on delete set null,
  created_by_name text,
  charged_at timestamptz not null default now(),
  -- null = el pedido no tiene productos de ese sector de preparación
  sector_frio_status text check (sector_frio_status in ('PENDIENTE','EN_PREPARACION','LISTO')),
  sector_caliente_status text check (sector_caliente_status in ('PENDIENTE','EN_PREPARACION','LISTO')),
  completed_at timestamptz,
  voided_at timestamptz,
  void_reason text,
  voided_by uuid references staff(id) on delete set null,
  voided_by_name text,
  unique (event_id, order_number)
);
create index orders_event_idx on orders(event_id);
create index orders_event_status_idx on orders(event_id, status);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  -- snapshots: nunca cambian aunque el producto se edite o borre después
  product_name text not null,
  category text not null,
  sector_economico text not null check (sector_economico in ('FRIO','CALIENTE')),
  sector_preparacion text not null check (sector_preparacion in ('FRIO','CALIENTE')),
  unit_price numeric(12,2) not null,
  quantity integer not null check (quantity > 0),
  subtotal numeric(12,2) not null
);
create index order_items_order_idx on order_items(order_id);
create index order_items_product_idx on order_items(product_id);

create table stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  event_id uuid not null references events(id) on delete cascade,
  type text not null check (type in ('VENTA','ANULACION','AJUSTE','CARGA_INICIAL')),
  quantity_delta integer not null,
  order_id uuid references orders(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);
create index stock_movements_product_idx on stock_movements(product_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- El cliente (browser) usa la clave "anon" solo para LEER (necesario para
-- Realtime). Todas las escrituras pasan por Route Handlers de Next.js con la
-- clave "service_role", que ignora RLS. `staff` no tiene policy de SELECT:
-- el cliente nunca puede leer los hashes de PIN.
-- ============================================================================
alter table events enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table stock_movements enable row level security;
alter table staff enable row level security;

create policy "read events" on events for select using (true);
create policy "read products" on products for select using (true);
create policy "read orders" on orders for select using (true);
create policy "read order_items" on order_items for select using (true);
create policy "read stock_movements" on stock_movements for select using (true);
-- (staff: sin policies => ninguna operación permitida a anon/authenticated)

-- ============================================================================
-- FUNCIONES (RPC) — encapsulan las transacciones críticas para que sean
-- atómicas: numeración de pedido, descuento/reversión de stock, cálculo de
-- estado general. Solo ejecutables por service_role (nunca desde el browser).
-- ============================================================================

-- ---------- Confirmar cobro ----------
create or replace function charge_order(
  p_event_id uuid,
  p_items jsonb, -- [{ "product_id": "...", "quantity": 2 }, ...]
  p_payment_method text,
  p_staff_id uuid,
  p_staff_name text,
  p_discount_percent numeric default 0 -- 0 (normal) o 20 (feriante). Ignorado si CORTESIA.
) returns orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event events%rowtype;
  v_order orders%rowtype;
  v_order_number integer;
  v_total numeric(12,2) := 0;
  v_item jsonb;
  v_product products%rowtype;
  v_qty integer;
  v_unit_price numeric(12,2);
  v_subtotal numeric(12,2);
  v_frio_present boolean := false;
  v_caliente_present boolean := false;
  -- El descuento efectivo nunca se toma directo del cliente sin validar:
  -- CORTESIA siempre es 100% (regalo), y el único otro descuento permitido
  -- es el de feriante (20%). Cualquier otro valor se rechaza.
  v_discount_percent numeric;
  v_discount_label text;
begin
  if p_payment_method not in ('EFECTIVO','TRANSFERENCIA','DEBITO','CORTESIA') then
    raise exception 'Medio de pago inválido';
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido no tiene productos';
  end if;

  if p_payment_method = 'CORTESIA' then
    v_discount_percent := 100;
    v_discount_label := 'Cortesía';
  elsif coalesce(p_discount_percent, 0) = 20 then
    v_discount_percent := 20;
    v_discount_label := 'Feriante -20%';
  elsif coalesce(p_discount_percent, 0) = 0 then
    v_discount_percent := 0;
    v_discount_label := null;
  else
    raise exception 'Descuento inválido';
  end if;

  select * into v_event from events where id = p_event_id for update;
  if not found then
    raise exception 'Evento no encontrado';
  end if;
  if v_event.status <> 'ACTIVO' then
    raise exception 'El evento no está activo, no se pueden registrar cobros';
  end if;

  -- Primera pasada: bloquear y validar cada producto (evita condiciones de
  -- carrera de stock entre cajas simultáneas) usando SIEMPRE precio/stock
  -- vigentes en la base, nunca lo que mande el cliente.
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item->>'quantity')::integer;
    if v_qty is null or v_qty <= 0 then
      raise exception 'Cantidad inválida';
    end if;

    select * into v_product from products
      where id = (v_item->>'product_id')::uuid and event_id = p_event_id
      for update;
    if not found then
      raise exception 'El producto no pertenece a este evento';
    end if;
    if not v_product.active then
      raise exception 'El producto "%" está desactivado', v_product.name;
    end if;
    if v_product.track_stock and v_product.stock_qty < v_qty then
      raise exception 'Stock insuficiente de "%": quedan %', v_product.name, v_product.stock_qty;
    end if;
  end loop;

  -- Número de pedido correlativo por evento, asignado de forma atómica.
  update events set order_counter = order_counter + 1
    where id = p_event_id
    returning order_counter into v_order_number;

  insert into orders (event_id, order_number, status, payment_method, total, discount_label, created_by, created_by_name, charged_at)
    values (p_event_id, v_order_number, 'COBRADO', p_payment_method, 0, v_discount_label, p_staff_id, p_staff_name, now())
    returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item->>'quantity')::integer;
    select * into v_product from products where id = (v_item->>'product_id')::uuid;
    -- Precio con el descuento ya aplicado: éste es el precio "histórico" que
    -- queda grabado para siempre en el pedido (sección 30), y sobre el que
    -- se calcula después el reparto 70/30 — así el descuento queda repartido
    -- proporcionalmente entre organizador y socio, no solo de un lado.
    v_unit_price := round(v_product.price * (1 - v_discount_percent / 100.0), 2);
    v_subtotal := v_unit_price * v_qty;
    v_total := v_total + v_subtotal;

    insert into order_items (
      order_id, product_id, product_name, category,
      sector_economico, sector_preparacion, unit_price, quantity, subtotal
    ) values (
      v_order.id, v_product.id, v_product.name, v_product.category,
      v_product.sector_economico, v_product.sector_preparacion, v_unit_price, v_qty, v_subtotal
    );

    if v_product.sector_preparacion = 'FRIO' then v_frio_present := true; end if;
    if v_product.sector_preparacion = 'CALIENTE' then v_caliente_present := true; end if;

    if v_product.track_stock then
      update products set stock_qty = stock_qty - v_qty where id = v_product.id;
      insert into stock_movements (product_id, event_id, type, quantity_delta, order_id)
        values (v_product.id, p_event_id, 'VENTA', -v_qty, v_order.id);
    end if;
  end loop;

  update orders set
      total = v_total,
      sector_frio_status = case when v_frio_present then 'PENDIENTE' else null end,
      sector_caliente_status = case when v_caliente_present then 'PENDIENTE' else null end
    where id = v_order.id
    returning * into v_order;

  return v_order;
end;
$$;

-- ---------- Anular pedido ----------
create or replace function void_order(
  p_order_id uuid,
  p_reason text,
  p_staff_id uuid,
  p_staff_name text
) returns orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order orders%rowtype;
  v_item order_items%rowtype;
begin
  select * into v_order from orders where id = p_order_id for update;
  if not found then
    raise exception 'Pedido no encontrado';
  end if;
  if v_order.status = 'ANULADO' then
    raise exception 'El pedido ya estaba anulado';
  end if;
  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'Se requiere un motivo de anulación';
  end if;

  -- Revertir stock de los productos que sí lo controlan.
  for v_item in select * from order_items where order_id = p_order_id
  loop
    if v_item.product_id is not null then
      update products set stock_qty = stock_qty + v_item.quantity
        where id = v_item.product_id and track_stock = true;
      if found then
        insert into stock_movements (product_id, event_id, type, quantity_delta, order_id, note)
          values (v_item.product_id, v_order.event_id, 'ANULACION', v_item.quantity, v_order.id, p_reason);
      end if;
    end if;
  end loop;

  update orders set
      status = 'ANULADO',
      voided_at = now(),
      void_reason = p_reason,
      voided_by = p_staff_id,
      voided_by_name = p_staff_name
    where id = p_order_id
    returning * into v_order;

  return v_order;
end;
$$;

-- ---------- Cambiar estado de preparación de un sector de un pedido ----------
create or replace function update_order_prep_status(
  p_order_id uuid,
  p_sector text,
  p_status text
) returns orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order orders%rowtype;
begin
  if p_sector not in ('FRIO','CALIENTE') then
    raise exception 'Sector inválido';
  end if;
  if p_status not in ('PENDIENTE','EN_PREPARACION','LISTO') then
    raise exception 'Estado inválido';
  end if;

  select * into v_order from orders where id = p_order_id for update;
  if not found then
    raise exception 'Pedido no encontrado';
  end if;
  if v_order.status = 'ANULADO' then
    raise exception 'El pedido está anulado';
  end if;

  if p_sector = 'FRIO' then
    if v_order.sector_frio_status is null then
      raise exception 'Este pedido no tiene productos del sector frío';
    end if;
    update orders set sector_frio_status = p_status where id = p_order_id;
  else
    if v_order.sector_caliente_status is null then
      raise exception 'Este pedido no tiene productos del sector caliente';
    end if;
    update orders set sector_caliente_status = p_status where id = p_order_id;
  end if;

  -- "Pedido completo" cuando todos los sectores presentes están LISTO.
  update orders set completed_at = case
      when (sector_frio_status is null or sector_frio_status = 'LISTO')
       and (sector_caliente_status is null or sector_caliente_status = 'LISTO')
      then coalesce(completed_at, now())
      else null
    end
    where id = p_order_id
    returning * into v_order;

  return v_order;
end;
$$;

-- Solo el backend (service_role) puede ejecutar estas funciones.
revoke all on function charge_order(uuid, jsonb, text, uuid, text, numeric) from public;
revoke all on function void_order(uuid, text, uuid, text) from public;
revoke all on function update_order_prep_status(uuid, text, text) from public;
grant execute on function charge_order(uuid, jsonb, text, uuid, text, numeric) to service_role;
grant execute on function void_order(uuid, text, uuid, text) to service_role;
grant execute on function update_order_prep_status(uuid, text, text) to service_role;

-- ============================================================================
-- REALTIME — agrega las tablas a la publicación por defecto de Supabase.
-- Bloques idempotentes: no fallan si ya estaban agregadas.
-- ============================================================================
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'events') then
    alter publication supabase_realtime add table events;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'products') then
    alter publication supabase_realtime add table products;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders') then
    alter publication supabase_realtime add table orders;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'order_items') then
    alter publication supabase_realtime add table order_items;
  end if;
end $$;
