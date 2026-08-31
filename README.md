# Barra Manager

PWA para gestionar venta, cobro, preparación, stock y cierre de caja de una
barra de bebidas en eventos y festivales. Pensada para usarse simultáneamente
desde varios celulares/tablets (Caja, Frío, Caliente, Admin) con sincronización
en tiempo real.

Primer evento cargado: **Conciencia Solar** — 13/09/2026 — UNLAM.

## Stack

- **Next.js 14 (App Router) + TypeScript + Tailwind CSS**
- **Supabase** (Postgres + Realtime + RLS) como base de datos centralizada
- **PWA** instalable (`@ducanh2912/next-pwa`)
- Autenticación liviana por **PIN de 4 dígitos** por sector/persona (sin
  contraseñas), pensada para tablets compartidas durante el evento

## 1. Crear el proyecto de Supabase

1. Entrá a [supabase.com](https://supabase.com) y creá un proyecto nuevo (plan
   Free alcanza).
2. Andá a **SQL Editor** y ejecutá, en este orden:
   1. Todo el contenido de [`supabase/schema.sql`](./supabase/schema.sql)
      (tablas, seguridad por fila, funciones y realtime).
   2. Todo el contenido de [`supabase/seed.sql`](./supabase/seed.sql)
      (evento Conciencia Solar + productos + usuarios de staff con PIN).
3. Andá a **Settings → API** y copiá:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (¡secreta! nunca la
     expongas en el frontend ni la subas a git)

## 2. Configurar variables de entorno

Copiá `.env.example` a `.env.local` y completá los valores:

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SESSION_SECRET=...   # generar con: openssl rand -base64 32
```

## 3. Correr en desarrollo

```bash
npm install
npm run dev
```

Abrí http://localhost:3000

## 4. Primeros pasos dentro de la app

1. Entrá como **⚙️ ADMINISTRADOR** con el PIN semilla **`9999`**.
2. Andá a **Staff / PINs** y cambiá TODOS los PIN semilla antes del evento:
   - Administrador: `9999`
   - Caja: `1111`
   - Frío: `2222`
   - Caliente: `3333`
3. Andá a **Eventos → Conciencia Solar**, revisá/ajustá el **stock inicial**
   desde **Productos y precios** (el seed carga cantidades de ejemplo para
   jugos/agua/gaseosas — reemplazalas por las cantidades reales compradas).
4. Tocá **▶ Iniciar evento**. A partir de ahí:
   - La numeración de pedidos arranca en `#001`.
   - Se habilita la pantalla de **Caja** para cobrar.
5. Al terminar el evento, desde **Eventos → 🔒 Cerrar evento** (o desde
   **Cierre de caja**) se bloquean nuevas ventas y queda todo el historial
   disponible para siempre en **Historial**.

## 5. Roles / pantallas

| Rol | Pantalla | PIN semilla |
| --- | --- | --- |
| 💰 Caja | `/caja` — vender y cobrar | `1111` |
| 🧊 Frío | `/frio` — preparar pedidos del sector frío | `2222` |
| 🔥 Caliente | `/caliente` — preparar pedidos del sector caliente | `3333` |
| ⚙️ Administrador | `/admin` — todo lo anterior + eventos, productos, staff, cierre | `9999` |

## 6. Reglas de negocio implementadas

- **Separación económica vs. preparación**: cada producto tiene
  `sector_economico` y `sector_preparacion` independientes (una recarga de
  agua caliente factura como FRÍO pero se prepara en CALIENTE).
- **Reparto**: 100% del sector frío es del organizador; del sector caliente,
  70% para el socio y 30% para el organizador. `TOTAL ORGANIZADOR = 100% FRÍO
  + 30% CALIENTE`. No hay ningún reparto posterior.
- **Precios históricos**: el precio de cada venta queda "congelado" en el
  momento del cobro (`order_items.unit_price`); cambiar el precio de un
  producto en Admin nunca reescribe ventas pasadas.
- **Pedidos mixtos**: un pedido con productos de ambos sectores aparece en
  Frío y en Caliente simultáneamente, cada uno viendo solo sus propios ítems,
  bajo el mismo número de pedido.
- **Anulaciones**: piden motivo, quedan registradas para auditoría, revierten
  el stock automáticamente y se excluyen de toda la facturación/cierre.
- **Stock**: se descuenta en cada cobro y se revierte en cada anulación, con
  historial completo en `stock_movements`. Las recargas y los productos del
  sector caliente están configurados sin control de stock unitario por
  defecto.
- **Un solo evento activo a la vez**, cada uno con su propia numeración de
  pedidos, productos, precios y stock — sin tocar nunca el historial de
  eventos anteriores.

## 7. Deploy en Vercel

1. Importá este repo en [vercel.com](https://vercel.com/new).
2. Cargá las mismas 4 variables de entorno del paso 2 en **Settings →
   Environment Variables**.
3. Deploy. Al ser una PWA, cualquier celular/tablet puede "Agregar a
   pantalla de inicio" desde el navegador para instalarla.

## 8. Estructura del proyecto

```
app/            Pantallas (App Router) y Route Handlers (app/api/**)
lib/            Lógica compartida: sesión, Supabase, cierre de caja, hooks
components/     Componentes de UI reutilizables
supabase/       schema.sql y seed.sql para crear la base de datos
public/         manifest.json, íconos de la PWA
```

## 9. Fuera de alcance de esta primera versión

Por decisión explícita del pedido original: sin facturación fiscal/AFIP, sin
factura electrónica, sin ningún reparto de dinero más allá del 70/30 del
sector caliente. La exportación a PDF se cubre con la vista imprimible
(`Imprimir / PDF` en Cierre de caja, usando "Guardar como PDF" del navegador)
en vez de un generador de PDF dedicado.
