"use client";
import { TopBar } from "@/components/TopBar";
import { AdminNav } from "@/components/admin/AdminNav";
import { useActiveEvent } from "@/lib/hooks/useEvents";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { activeEvent } = useActiveEvent();

  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar title="⚙️ ADMINISTRADOR" accentClassName="bg-slate-800" eventName={activeEvent?.name} />
      <AdminNav />
      <main className="flex-1 overflow-y-auto bg-slate-50">{children}</main>
    </div>
  );
}
