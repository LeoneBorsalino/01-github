"use client";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/fetcher";
import { useSession } from "@/lib/hooks/useSession";

export function TopBar({
  title,
  accentClassName = "bg-slate-800",
  eventName,
  right,
}: {
  title: string;
  accentClassName?: string;
  eventName?: string | null;
  right?: React.ReactNode;
}) {
  const router = useRouter();
  const { session } = useSession();

  async function logout() {
    await apiPost("/api/auth/logout");
    router.push("/");
    router.refresh();
  }

  return (
    <header className={`flex items-center justify-between gap-3 px-4 py-3 text-white ${accentClassName}`}>
      <div>
        <h1 className="text-xl font-bold leading-tight">{title}</h1>
        {eventName && <p className="text-sm text-white/80 leading-tight">{eventName}</p>}
      </div>
      <div className="flex items-center gap-3">
        {right}
        {session && <span className="hidden text-sm text-white/80 sm:inline">{session.name}</span>}
        <button
          onClick={logout}
          className="rounded-lg bg-black/20 px-3 py-2 text-sm font-semibold hover:bg-black/30"
        >
          Salir
        </button>
      </div>
    </header>
  );
}
