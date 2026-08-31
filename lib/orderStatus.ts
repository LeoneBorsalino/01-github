import type { GeneralOrderStatus, OrderRow } from "./types";

/**
 * Estado general de un pedido, siempre DERIVADO (nunca almacenado) a partir
 * de sector_frio_status / sector_caliente_status, para que Frío, Caliente y
 * el Monitor de Admin nunca puedan mostrar cosas distintas.
 */
export function generalOrderStatus(order: OrderRow): GeneralOrderStatus {
  if (order.status === "ANULADO") return "ANULADO";

  const statuses = [order.sector_frio_status, order.sector_caliente_status].filter(
    (s): s is NonNullable<typeof s> => s !== null
  );

  if (statuses.length === 0) return "COMPLETO"; // no debería pasar, pero por las dudas
  if (statuses.every((s) => s === "LISTO")) return "COMPLETO";
  if (statuses.some((s) => s === "LISTO")) return "PARCIAL";
  if (statuses.some((s) => s === "EN_PREPARACION")) return "EN_PREPARACION";
  return "PENDIENTE";
}

export const GENERAL_STATUS_LABEL: Record<GeneralOrderStatus, string> = {
  ANULADO: "Anulado",
  PENDIENTE: "Pendiente",
  EN_PREPARACION: "En preparación",
  PARCIAL: "Parcial",
  COMPLETO: "Completo",
};

export const GENERAL_STATUS_COLOR: Record<GeneralOrderStatus, string> = {
  ANULADO: "bg-slate-200 text-slate-500 line-through",
  PENDIENTE: "bg-amber-100 text-amber-800",
  EN_PREPARACION: "bg-amber-100 text-amber-800",
  PARCIAL: "bg-sky-100 text-sky-800",
  COMPLETO: "bg-organizador-bg text-organizador-dark",
};

export const PREP_STATUS_LABEL = {
  PENDIENTE: "Pendiente",
  EN_PREPARACION: "En preparación",
  LISTO: "Listo",
} as const;

/** Próximo estado al tocar el botón en Frío/Caliente (ciclo simple). */
export function nextPrepStatus(current: "PENDIENTE" | "EN_PREPARACION" | "LISTO") {
  if (current === "PENDIENTE") return "EN_PREPARACION" as const;
  if (current === "EN_PREPARACION") return "LISTO" as const;
  return "LISTO" as const;
}
