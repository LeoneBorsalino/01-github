import { Suspense } from "react";
import { ProductosClient } from "@/components/admin/ProductosClient";

export default function ProductosPage() {
  return (
    <Suspense fallback={<p className="p-6 text-slate-400">Cargando…</p>}>
      <ProductosClient />
    </Suspense>
  );
}
