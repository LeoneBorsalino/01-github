const formatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

/** $5.900 (formato Argentina, sin decimales — los productos usan pesos enteros) */
export function formatMoney(value: number): string {
  return formatter.format(value ?? 0);
}
