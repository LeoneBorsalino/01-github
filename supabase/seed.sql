-- ============================================================================
-- Datos iniciales: evento "Conciencia Solar" + sus productos + staff semilla.
-- Ejecutar DESPUÉS de schema.sql. Es seguro re-ejecutar: usa nombres únicos
-- para no duplicar si ya corrió antes en el mismo proyecto (ver comentario).
-- ============================================================================

-- ---------- Staff semilla — ¡CAMBIAR ESTOS PIN DESDE /admin/staff APENAS ARRANQUE! ----------
insert into staff (name, role, pin_hash, active) values
  ('Administrador', 'ADMIN',    crypt('9999', gen_salt('bf')), true),
  ('Caja',          'CAJA',     crypt('1111', gen_salt('bf')), true),
  ('Frío',          'FRIO',     crypt('2222', gen_salt('bf')), true),
  ('Caliente',      'CALIENTE', crypt('3333', gen_salt('bf')), true);

-- ---------- Evento: Conciencia Solar ----------
with new_event as (
  insert into events (name, date, location, description, status)
  values (
    'Conciencia Solar',
    '2026-09-13',
    'UNLAM — Universidad Nacional de La Matanza',
    null,
    'BORRADOR'
  )
  returning id
)
insert into products (
  event_id, name, category, sector_economico, sector_preparacion,
  price, track_stock, stock_qty, low_stock_threshold, active, sort_order
)
select
  new_event.id, v.name, v.category, v.sector_economico, v.sector_preparacion,
  v.price, v.track_stock, v.stock_qty, v.low_stock_threshold, true, v.sort_order
from new_event, (values
  -- 🧊 SECTOR FRÍO — Jugos 500ml ($5.900)
  ('Jugo Manzana 500ml',          'Jugos',     'FRIO', 'FRIO', 5900::numeric, true,  50, 10, 1),
  ('Jugo Naranja 500ml',          'Jugos',     'FRIO', 'FRIO', 5900::numeric, true,  50, 10, 2),
  ('Jugo Green Detox 500ml',      'Jugos',     'FRIO', 'FRIO', 5900::numeric, true,  50, 10, 3),
  -- Agua embotellada ($2.700, marca editable desde admin)
  ('Agua Villavicencio 500ml',    'Agua',      'FRIO', 'FRIO', 2700::numeric, true, 100, 20, 4),
  -- Gaseosas ($3.800)
  ('Coca-Cola Zero 600ml',        'Gaseosas',  'FRIO', 'FRIO', 3800::numeric, true,  80, 15, 5),
  ('Sprite Zero 600ml',           'Gaseosas',  'FRIO', 'FRIO', 3800::numeric, true,  80, 15, 6),
  -- Recargas de agua — SIEMPRE sector económico FRIO (aunque sea recarga caliente), sin stock unitario
  ('Recarga agua fría 500ml',     'Recargas',  'FRIO', 'FRIO', 1100::numeric, false,  0,  0, 7),
  ('Recarga agua caliente 500ml', 'Recargas',  'FRIO', 'FRIO', 1100::numeric, false,  0,  0, 8),
  ('Recarga agua fría 1L',        'Recargas',  'FRIO', 'FRIO', 2200::numeric, false,  0,  0, 9),
  ('Recarga agua caliente 1L',    'Recargas',  'FRIO', 'FRIO', 2200::numeric, false,  0,  0, 10),
  -- 🔥 SECTOR CALIENTE
  ('Café',                            'Café y té',  'CALIENTE', 'CALIENTE', 3000::numeric, false, 0, 0, 11),
  ('Café doble',                      'Café y té',  'CALIENTE', 'CALIENTE', 4500::numeric, false, 0, 0, 12),
  ('Café con leche',                  'Café y té',  'CALIENTE', 'CALIENTE', 4500::numeric, false, 0, 0, 13),
  ('Capuchino',                       'Café y té',  'CALIENTE', 'CALIENTE', 5000::numeric, false, 0, 0, 14),
  ('Lágrima',                         'Café y té',  'CALIENTE', 'CALIENTE', 5000::numeric, false, 0, 0, 15),
  ('Té',                              'Café y té',  'CALIENTE', 'CALIENTE', 3000::numeric, false, 0, 0, 16),
  ('Té de hierbas',                   'Café y té',  'CALIENTE', 'CALIENTE', 4000::numeric, false, 0, 0, 17),
  ('Medialuna de manteca integral',   'Pastelería', 'CALIENTE', 'CALIENTE', 1200::numeric, false, 0, 0, 18),
  ('Mini cremona',                    'Pastelería', 'CALIENTE', 'CALIENTE', 1200::numeric, false, 0, 0, 19),
  ('Adicional de leche vegetal',      'Adicionales','CALIENTE', 'CALIENTE', 1000::numeric, false, 0, 0, 20)
) as v(name, category, sector_economico, sector_preparacion, price, track_stock, stock_qty, low_stock_threshold, sort_order);

-- Nota: el stock inicial de jugos/agua/gaseosas de arriba es un valor de
-- ejemplo (50/100/80 unidades). Ajustalo a la cantidad real comprada desde
-- /admin/productos antes de "Iniciar evento".
