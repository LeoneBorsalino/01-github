import { Suspense } from "react";
import { CierreClient } from "@/components/admin/CierreClient";

export default function CierrePage() {
  return (
    <Suspense fallback={<p className="p-6 text-slate-400">Cargando…</p>}>
      <CierreClient />
    </Suspense>
  );
}
