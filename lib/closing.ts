import type { OrderItemRow, OrderRow, PaymentMethod, Sector } from "./types";

// ============================================================================
// REGLA ECONÓMICA (innegociable):
//   FRÍO      = 100% para el organizador
//   CALIENTE  = 70% socio / 30% organizador
//   TOTAL ORGANIZADOR = 100% FRÍO + 30% CALIENTE
// No se implementa ningún reparto posterior a este cálculo.
// ============================================================================

export interface ProductSummary {
  productName: string;
  category: string;
  sectorEconomico: Sector;
  quantity: number;
  subtotal: number;
}

export type PaymentBreakdown = Record<PaymentMethod, number>;

export interface SectorClosing {
  quantityTotal: number;
  revenue: number;
  byPayment: PaymentBreakdown;
  byProduct: ProductSummary[];
}

export interface ClosingResult {
  frio: SectorClosing;
  caliente: SectorClosing;
  /** 70% de la facturación caliente — le corresponde al socio del sector caliente */
  calienteSocio70: number;
  /** 30% de la facturación caliente — le corresponde al organizador */
  calienteOrganizador30: number;
  /** 100% frío + 30% caliente. Resultado final, sin repartos posteriores. */
  totalOrganizador: number;
  totalFacturado: number;
  totalByPayment: PaymentBreakdown;
  /** Pedidos con medio de pago CORTESIA: regalos a staff/músicos, aparte de
   *  las ventas reales, para poder reconciliarlos con el festival. */
  cortesia: { quantityTotal: number; byProduct: ProductSummary[] };
  ordersCount: number;
  voidedCount: number;
  consistency: {
    ok: boolean;
    sumItemsVsOrders: { items: number; orders: number; diff: number };
    sumPaymentsVsTotal: { payments: number; total: number; diff: number };
  };
}

function emptyPayment(): PaymentBreakdown {
  return { EFECTIVO: 0, TRANSFERENCIA: 0, DEBITO: 0, CORTESIA: 0 };
}

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

type OrderLike = Pick<OrderRow, "id" | "status" | "payment_method" | "total">;
type ItemLike = Pick<
  OrderItemRow,
  "order_id" | "product_name" | "category" | "sector_economico" | "quantity" | "subtotal"
>;

/**
 * Calcula el cierre de caja completo de un evento a partir de sus pedidos e
 * ítems. Función pura (sin acceso a red/DB) para poder reutilizarla desde la
 * API de cierre, el historial y los exports CSV/Excel, y para poder testearla
 * fácilmente. Los pedidos ANULADO se cuentan (voidedCount) pero se excluyen
 * de toda la facturación.
 */
export function computeClosing(orders: OrderLike[], items: ItemLike[]): ClosingResult {
  const paidOrders = orders.filter((o) => o.status === "COBRADO");
  const voidedCount = orders.length - paidOrders.length;
  const paidOrderIds = new Set(paidOrders.map((o) => o.id));
  const paymentByOrder = new Map(paidOrders.map((o) => [o.id, o.payment_method]));

  const sectors: Record<Sector, SectorClosing> = {
    FRIO: { quantityTotal: 0, revenue: 0, byPayment: emptyPayment(), byProduct: [] },
    CALIENTE: { quantityTotal: 0, revenue: 0, byPayment: emptyPayment(), byProduct: [] },
  };
  const productMaps: Record<Sector, Map<string, ProductSummary>> = {
    FRIO: new Map(),
    CALIENTE: new Map(),
  };
  const cortesiaMap = new Map<string, ProductSummary>();
  let cortesiaQuantityTotal = 0;

  let sumItems = 0;

  for (const item of items) {
    if (!paidOrderIds.has(item.order_id)) continue; // pedido anulado (o huérfano): fuera del cierre
    const paymentMethod = paymentByOrder.get(item.order_id);
    if (!paymentMethod) continue;
    sumItems = round2(sumItems + item.subtotal);

    if (paymentMethod === "CORTESIA") {
      // Regalo a staff/músicos: no cuenta como venta real, se muestra aparte.
      cortesiaQuantityTotal += item.quantity;
      const existingGift = cortesiaMap.get(item.product_name);
      if (existingGift) {
        existingGift.quantity += item.quantity;
      } else {
        cortesiaMap.set(item.product_name, {
          productName: item.product_name,
          category: item.category,
          sectorEconomico: item.sector_economico,
          quantity: item.quantity,
          subtotal: 0,
        });
      }
      continue;
    }

    const sector = sectors[item.sector_economico];
    sector.quantityTotal += item.quantity;
    sector.revenue = round2(sector.revenue + item.subtotal);
    sector.byPayment[paymentMethod] = round2(sector.byPayment[paymentMethod] + item.subtotal);

    const map = productMaps[item.sector_economico];
    const existing = map.get(item.product_name);
    if (existing) {
      existing.quantity += item.quantity;
      existing.subtotal = round2(existing.subtotal + item.subtotal);
    } else {
      map.set(item.product_name, {
        productName: item.product_name,
        category: item.category,
        sectorEconomico: item.sector_economico,
        quantity: item.quantity,
        subtotal: item.subtotal,
      });
    }
  }

  sectors.FRIO.byProduct = [...productMaps.FRIO.values()].sort((a, b) => b.subtotal - a.subtotal);
  sectors.CALIENTE.byProduct = [...productMaps.CALIENTE.values()].sort(
    (a, b) => b.subtotal - a.subtotal
  );

  const calienteSocio70 = round2(sectors.CALIENTE.revenue * 0.7);
  const calienteOrganizador30 = round2(sectors.CALIENTE.revenue * 0.3);
  const totalOrganizador = round2(sectors.FRIO.revenue + calienteOrganizador30);
  const totalFacturado = round2(sectors.FRIO.revenue + sectors.CALIENTE.revenue);

  const totalByPayment: PaymentBreakdown = {
    EFECTIVO: round2(sectors.FRIO.byPayment.EFECTIVO + sectors.CALIENTE.byPayment.EFECTIVO),
    TRANSFERENCIA: round2(
      sectors.FRIO.byPayment.TRANSFERENCIA + sectors.CALIENTE.byPayment.TRANSFERENCIA
    ),
    DEBITO: round2(sectors.FRIO.byPayment.DEBITO + sectors.CALIENTE.byPayment.DEBITO),
    CORTESIA: round2(sectors.FRIO.byPayment.CORTESIA + sectors.CALIENTE.byPayment.CORTESIA),
  };

  const sumOrdersTotal = round2(paidOrders.reduce((acc, o) => acc + Number(o.total), 0));
  const sumPayments = round2(
    totalByPayment.EFECTIVO +
      totalByPayment.TRANSFERENCIA +
      totalByPayment.DEBITO +
      totalByPayment.CORTESIA
  );
  const diffItemsOrders = round2(Math.abs(sumItems - sumOrdersTotal));
  const diffPaymentsTotal = round2(Math.abs(sumPayments - totalFacturado));

  return {
    frio: sectors.FRIO,
    caliente: sectors.CALIENTE,
    cortesia: {
      quantityTotal: cortesiaQuantityTotal,
      byProduct: [...cortesiaMap.values()].sort((a, b) => b.quantity - a.quantity),
    },
    calienteSocio70,
    calienteOrganizador30,
    totalOrganizador,
    totalFacturado,
    totalByPayment,
    ordersCount: paidOrders.length,
    voidedCount,
    consistency: {
      ok: diffItemsOrders < 0.01 && diffPaymentsTotal < 0.01,
      sumItemsVsOrders: { items: sumItems, orders: sumOrdersTotal, diff: diffItemsOrders },
      sumPaymentsVsTotal: { payments: sumPayments, total: totalFacturado, diff: diffPaymentsTotal },
    },
  };
}
