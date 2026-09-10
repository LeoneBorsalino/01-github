"use client";
import { formatMoney } from "@/lib/money";
import type { ClosingResult, SectorClosing } from "@/lib/closing";
import type { EventRow } from "@/lib/types";

function SectorCard({
  title,
  colorClass,
  sector,
}: {
  title: string;
  colorClass: string;
  sector: SectorClosing;
}) {
  return (
    <div className="card">
      <h3 className={`mb-3 text-lg font-bold ${colorClass}`}>{title}</h3>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Unidades vendidas" value={String(sector.quantityTotal)} />
        <Stat label="Facturación" value={formatMoney(sector.revenue)} />
        <Stat label="Efectivo" value={formatMoney(sector.byPayment.EFECTIVO)} />
        <Stat label="Transferencia" value={formatMoney(sector.byPayment.TRANSFERENCIA)} />
      </div>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Débito / POSnet" value={formatMoney(sector.byPayment.DEBITO)} />
      </div>
      <table className="w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="py-1">Producto</th>
            <th className="py-1">Cant.</th>
            <th className="py-1">Facturación</th>
          </tr>
        </thead>
        <tbody>
          {sector.byProduct.map((p) => (
            <tr key={p.productName} className="border-t border-slate-100">
              <td className="py-1">{p.productName}</td>
              <td className="py-1">{p.quantity}</td>
              <td className="py-1">{formatMoney(p.subtotal)}</td>
            </tr>
          ))}
          {sector.byProduct.length === 0 && (
            <tr>
              <td colSpan={3} className="py-2 text-slate-400">
                Sin ventas todavía
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-lg font-bold text-slate-800">{value}</p>
    </div>
  );
}

export function ClosingView({ event, closing }: { event: EventRow; closing: ClosingResult }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="card">
        <h2 className="text-xl font-bold text-slate-800">{event.name}</h2>
        <p className="text-sm text-slate-500">
          {event.date} — {event.location}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {closing.ordersCount} pedidos cobrados · {closing.voidedCount} anulados (excluidos del cierre)
        </p>
      </div>

      {!closing.consistency.ok && (
        <div className="card border-2 border-peligro bg-peligro-bg">
          <p className="font-bold text-peligro">⚠️ Se detectaron diferencias de consistencia</p>
          <p className="text-sm text-peligro">
            Suma de ítems ({formatMoney(closing.consistency.sumItemsVsOrders.items)}) vs. suma de
            pedidos ({formatMoney(closing.consistency.sumItemsVsOrders.orders)}). Suma de medios de
            pago ({formatMoney(closing.consistency.sumPaymentsVsTotal.payments)}) vs. total facturado
            ({formatMoney(closing.consistency.sumPaymentsVsTotal.total)}).
          </p>
        </div>
      )}

      <SectorCard title="🧊 Cierre sector frío" colorClass="text-frio-dark" sector={closing.frio} />
      <p className="px-1 text-sm text-slate-500">Todo el total frío corresponde 100% al organizador.</p>

      <SectorCard title="🔥 Cierre sector caliente" colorClass="text-caliente-dark" sector={closing.caliente} />
      <div className="card grid grid-cols-2 gap-3">
        <Stat label="70% — socio del sector caliente" value={formatMoney(closing.calienteSocio70)} />
        <Stat label="30% — organizador (de caliente)" value={formatMoney(closing.calienteOrganizador30)} />
      </div>

      <div className="card border-2 border-organizador bg-organizador-bg">
        <h3 className="mb-2 text-lg font-bold text-organizador-dark">💰 Total del organizador</h3>
        <div className="flex flex-col gap-1 text-slate-700">
          <p>100% facturación frío: <strong>{formatMoney(closing.frio.revenue)}</strong></p>
          <p>+ 30% facturación caliente: <strong>{formatMoney(closing.calienteOrganizador30)}</strong></p>
          <p className="mt-2 text-2xl font-extrabold text-organizador-dark">
            = {formatMoney(closing.totalOrganizador)}
          </p>
        </div>
      </div>

      <div className="card">
        <h3 className="mb-3 text-lg font-bold text-slate-800">Medios de pago — total del evento</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="💵 Efectivo" value={formatMoney(closing.totalByPayment.EFECTIVO)} />
          <Stat label="📲 Transferencia" value={formatMoney(closing.totalByPayment.TRANSFERENCIA)} />
          <Stat label="💳 Débito / POSnet" value={formatMoney(closing.totalByPayment.DEBITO)} />
          <Stat label="TOTAL FACTURADO" value={formatMoney(closing.totalFacturado)} />
        </div>
      </div>

      {closing.cortesia.quantityTotal > 0 && (
        <div className="card">
          <h3 className="mb-1 text-lg font-bold text-slate-800">🎁 Cortesías — staff / músicos</h3>
          <p className="mb-3 text-sm text-slate-500">
            Regalado a $0, aparte de la facturación. Usá esta lista para cobrárselo al festival al
            precio de costo que corresponda.
          </p>
          <Stat label="Unidades regaladas" value={String(closing.cortesia.quantityTotal)} />
          <table className="mt-3 w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="py-1">Producto</th>
                <th className="py-1">Cant.</th>
              </tr>
            </thead>
            <tbody>
              {closing.cortesia.byProduct.map((p) => (
                <tr key={p.productName} className="border-t border-slate-100">
                  <td className="py-1">{p.productName}</td>
                  <td className="py-1">{p.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
