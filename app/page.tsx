"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PinPad } from "@/components/PinPad";
import { apiPost } from "@/lib/fetcher";
import type { StaffRole } from "@/lib/types";

const ROLES: { role: StaffRole; label: string; emoji: string; className: string }[] = [
  { role: "CAJA", label: "CAJA", emoji: "💰", className: "bg-organizador text-white" },
  { role: "FRIO", label: "FRÍO", emoji: "🧊", className: "bg-frio text-white" },
  { role: "CALIENTE", label: "CALIENTE", emoji: "🔥", className: "bg-caliente text-white" },
  { role: "ADMIN", label: "ADMINISTRADOR", emoji: "⚙️", className: "bg-slate-700 text-white" },
];

const ROLE_HOME: Record<StaffRole, string> = {
  CAJA: "/caja",
  FRIO: "/frio",
  CALIENTE: "/caliente",
  ADMIN: "/admin",
};

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<StaffRole | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function selectRole(role: StaffRole) {
    setSelectedRole(role);
    setPin("");
    setError(null);
  }

  function backToRoles() {
    setSelectedRole(null);
    setPin("");
    setError(null);
  }

  function addDigit(d: string) {
    if (error) setError(null);
    setPin((p) => (p.length < 4 ? p + d : p));
  }

  async function confirm(finalPin?: string) {
    const pinToSend = finalPin ?? pin;
    if (!selectedRole || pinToSend.length !== 4) return;
    setLoading(true);
    setError(null);
    try {
      await apiPost("/api/auth/login", { role: selectedRole, pin: pinToSend });
      router.push(ROLE_HOME[selectedRole]);
      router.refresh();
    } catch {
      setError("PIN incorrecto");
      setPin("");
      setLoading(false);
    }
  }

  function onDigitAutoSubmit(d: string) {
    setError(null);
    setPin((p) => {
      const next = p.length < 4 ? p + d : p;
      if (next.length === 4) {
        // auto-confirmar apenas se completan los 4 dígitos (velocidad)
        setTimeout(() => confirm(next), 50);
      }
      return next;
    });
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">Barra Manager</h1>
        <p className="mt-1 text-slate-500">Gestión de barra de bebidas para eventos</p>
      </div>

      {!selectedRole ? (
        <div className="grid w-full max-w-md grid-cols-2 gap-4">
          {ROLES.map((r) => (
            <button
              key={r.role}
              onClick={() => selectRole(r.role)}
              className={`btn-big flex-col gap-1 py-8 text-xl ${r.className}`}
            >
              <span className="text-4xl">{r.emoji}</span>
              {r.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <p className="text-lg font-semibold text-slate-700">
            Ingresá el PIN de {ROLES.find((r) => r.role === selectedRole)?.label}
          </p>
          <PinPad
            value={pin}
            onDigit={onDigitAutoSubmit}
            onBackspace={() => {
              setError(null);
              setPin((p) => p.slice(0, -1));
            }}
            onConfirm={() => confirm()}
            disabled={loading}
          />
          {error && <p className="font-semibold text-peligro">{error}</p>}
          <button onClick={backToRoles} className="mt-2 text-slate-500 underline">
            ← Elegir otro sector
          </button>
        </div>
      )}
    </main>
  );
}
