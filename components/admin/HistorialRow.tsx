"use client";
import Link from "next/link";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { formatMoney } from "@/lib/money";
import type { ClosingResult } from "@/lib/closing";
import type { EventRow } from "@/lib/types";

export function HistorialRow({ event }: { event: EventRow }) {
  const { data } = useSWR<{ event: EventRow; closing: ClosingResult }>(
    `/api/events/${event.id}/cierre`,
    fetcher
  );
  const closing = data?.closing;

  return (
    <tr className="border-t border-slate-100">
      <td className="px-3 py-2">
        <Link href={`/admin/cierre?eventId=${event.id}`} className="font-bold text-slate-800 hover:underline">
          {event.name}
        </Link>
        <p className="text-xs text-slate-400">
          {event.date} — {event.location}
        </p>
      </td>
      <td className="px-3 py-2">{closing ? formatMoney(closing.totalFacturado) : "…"}</td>
      <td className="px-3 py-2">{closing ? formatMoney(closing.frio.revenue) : "…"}</td>
      <td className="px-3 py-2">{closing ? formatMoney(closing.caliente.revenue) : "…"}</td>
      <td className="px-3 py-2">{closing ? formatMoney(closing.calienteSocio70) : "…"}</td>
      <td className="px-3 py-2">{closing ? formatMoney(closing.calienteOrganizador30) : "…"}</td>
      <td className="px-3 py-2 font-bold text-organizador-dark">
        {closing ? formatMoney(closing.totalOrganizador) : "…"}
      </td>
      <td className="px-3 py-2">{closing ? formatMoney(closing.totalByPayment.EFECTIVO) : "…"}</td>
      <td className="px-3 py-2">{closing ? formatMoney(closing.totalByPayment.TRANSFERENCIA) : "…"}</td>
      <td className="px-3 py-2">{closing ? formatMoney(closing.totalByPayment.DEBITO) : "…"}</td>
      <td className="px-3 py-2">{closing?.ordersCount ?? "…"}</td>
      <td className="px-3 py-2">{closing?.voidedCount ?? "…"}</td>
    </tr>
  );
}
