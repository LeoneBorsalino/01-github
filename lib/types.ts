// Tipos de dominio compartidos por toda la app (server y cliente).
// Reflejan 1:1 los enums definidos en supabase/schema.sql.

export type Sector = "FRIO" | "CALIENTE";

export type StaffRole = "CAJA" | "FRIO" | "CALIENTE" | "ADMIN";

export type EventStatus = "BORRADOR" | "ACTIVO" | "CERRADO";

export type OrderStatus = "COBRADO" | "ANULADO";

export type PrepStatus = "PENDIENTE" | "EN_PREPARACION" | "LISTO";

export type PaymentMethod = "EFECTIVO" | "TRANSFERENCIA" | "DEBITO";

/** Estado general derivado de un pedido (nunca se almacena, ver lib/orderStatus.ts) */
export type GeneralOrderStatus =
  | "ANULADO"
  | "PENDIENTE"
  | "EN_PREPARACION"
  | "PARCIAL"
  | "COMPLETO";

export interface EventRow {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  location: string;
  description: string | null;
  status: EventStatus;
  order_counter: number;
  created_at: string;
  started_at: string | null;
  closed_at: string | null;
}

export interface ProductRow {
  id: string;
  event_id: string;
  name: string;
  category: string;
  sector_economico: Sector;
  sector_preparacion: Sector;
  price: number;
  track_stock: boolean;
  stock_qty: number;
  low_stock_threshold: number;
  active: boolean;
  sort_order: number;
}

export interface OrderRow {
  id: string;
  event_id: string;
  order_number: number;
  status: OrderStatus;
  payment_method: PaymentMethod;
  total: number;
  created_by: string | null;
  created_by_name: string | null;
  charged_at: string;
  sector_frio_status: PrepStatus | null;
  sector_caliente_status: PrepStatus | null;
  completed_at: string | null;
  voided_at: string | null;
  void_reason: string | null;
  voided_by: string | null;
  voided_by_name: string | null;
}

export interface OrderItemRow {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  category: string;
  sector_economico: Sector;
  sector_preparacion: Sector;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

export interface OrderWithItems extends OrderRow {
  items: OrderItemRow[];
}

export interface StaffRow {
  id: string;
  name: string;
  role: StaffRole;
  active: boolean;
}

/** Item del carrito local (antes de cobrar) — nunca se persiste hasta el cobro. */
export interface CartItem {
  productId: string;
  name: string;
  category: string;
  sectorEconomico: Sector;
  sectorPreparacion: Sector;
  unitPrice: number;
  quantity: number;
}

export interface SessionPayload {
  staffId: string;
  name: string;
  role: StaffRole;
}
