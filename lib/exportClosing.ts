import "server-only";
import ExcelJS from "exceljs";
import type { ClosingResult } from "./closing";
import type { EventRow } from "./types";
import { formatMoney } from "./money";

function csvEscape(value: string | number) {
  const str = String(value);
  if (/[",\n;]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function csvRow(values: (string | number)[]) {
  return values.map(csvEscape).join(";");
}

/** CSV de una sola hoja con el resumen completo del cierre (sección 39). */
export function buildClosingCsv(event: EventRow, closing: ClosingResult): string {
  const lines: string[] = [];
  lines.push(csvRow(["Evento", event.name]));
  lines.push(csvRow(["Fecha", event.date]));
  lines.push(csvRow(["Lugar", event.location]));
  lines.push(csvRow(["Pedidos cobrados", closing.ordersCount]));
  lines.push(csvRow(["Pedidos anulados", closing.voidedCount]));
  lines.push("");

  for (const [label, sector] of [
    ["SECTOR FRÍO", closing.frio],
    ["SECTOR CALIENTE", closing.caliente],
  ] as const) {
    lines.push(csvRow([label]));
    lines.push(csvRow(["Producto", "Cantidad", "Facturación"]));
    for (const p of sector.byProduct) {
      lines.push(csvRow([p.productName, p.quantity, p.subtotal]));
    }
    lines.push(csvRow(["TOTAL", sector.quantityTotal, sector.revenue]));
    lines.push(csvRow(["Efectivo", "", sector.byPayment.EFECTIVO]));
    lines.push(csvRow(["Transferencia", "", sector.byPayment.TRANSFERENCIA]));
    lines.push(csvRow(["Débito/POSnet", "", sector.byPayment.DEBITO]));
    lines.push("");
  }

  lines.push(csvRow(["REPARTO SECTOR CALIENTE"]));
  lines.push(csvRow(["70% socio del sector caliente", closing.calienteSocio70]));
  lines.push(csvRow(["30% organizador (de caliente)", closing.calienteOrganizador30]));
  lines.push("");

  lines.push(csvRow(["TOTAL DEL ORGANIZADOR"]));
  lines.push(csvRow(["100% facturación frío", closing.frio.revenue]));
  lines.push(csvRow(["+ 30% facturación caliente", closing.calienteOrganizador30]));
  lines.push(csvRow(["= TOTAL ORGANIZADOR", closing.totalOrganizador]));
  lines.push("");

  lines.push(csvRow(["MEDIOS DE PAGO (total evento)"]));
  lines.push(csvRow(["Efectivo", closing.totalByPayment.EFECTIVO]));
  lines.push(csvRow(["Transferencia", closing.totalByPayment.TRANSFERENCIA]));
  lines.push(csvRow(["Débito/POSnet", closing.totalByPayment.DEBITO]));
  lines.push(csvRow(["TOTAL FACTURADO", closing.totalFacturado]));
  lines.push("");
  lines.push(csvRow(["Consistencia OK", closing.consistency.ok ? "SI" : "NO — REVISAR"]));

  return "﻿" + lines.join("\n"); // BOM para que Excel abra bien los acentos
}

export async function buildClosingWorkbook(event: EventRow, closing: ClosingResult): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Barra Manager";

  const resumen = wb.addWorksheet("Resumen");
  resumen.columns = [{ width: 34 }, { width: 20 }, { width: 20 }];
  resumen.addRow(["Evento", event.name]);
  resumen.addRow(["Fecha", event.date]);
  resumen.addRow(["Lugar", event.location]);
  resumen.addRow(["Pedidos cobrados", closing.ordersCount]);
  resumen.addRow(["Pedidos anulados", closing.voidedCount]);
  resumen.addRow([]);
  resumen.addRow(["FACTURACIÓN FRÍO", closing.frio.revenue]);
  resumen.addRow(["FACTURACIÓN CALIENTE", closing.caliente.revenue]);
  resumen.addRow(["  70% socio caliente", closing.calienteSocio70]);
  resumen.addRow(["  30% organizador (de caliente)", closing.calienteOrganizador30]);
  resumen.addRow([]);
  const totalRow = resumen.addRow(["TOTAL DEL ORGANIZADOR", closing.totalOrganizador]);
  totalRow.font = { bold: true };
  resumen.addRow([]);
  resumen.addRow(["Efectivo", closing.totalByPayment.EFECTIVO]);
  resumen.addRow(["Transferencia", closing.totalByPayment.TRANSFERENCIA]);
  resumen.addRow(["Débito/POSnet", closing.totalByPayment.DEBITO]);
  resumen.addRow(["TOTAL FACTURADO", closing.totalFacturado]);
  resumen.addRow([]);
  resumen.addRow(["Consistencia", closing.consistency.ok ? "OK" : "REVISAR — hay diferencias"]);

  for (const [sheetName, sector] of [
    ["Productos Frío", closing.frio],
    ["Productos Caliente", closing.caliente],
  ] as const) {
    const ws = wb.addWorksheet(sheetName);
    ws.columns = [{ width: 32 }, { width: 12 }, { width: 16 }];
    ws.addRow(["Producto", "Cantidad", "Facturación"]).font = { bold: true };
    for (const p of sector.byProduct) {
      ws.addRow([p.productName, p.quantity, p.subtotal]);
    }
    const totalRowSector = ws.addRow(["TOTAL", sector.quantityTotal, sector.revenue]);
    totalRowSector.font = { bold: true };
  }

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

// Reexport para no repetir el import en las páginas de export.
export { formatMoney };
