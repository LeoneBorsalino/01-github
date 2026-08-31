"use client";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "borrar", "0", "ok"] as const;

export function PinPad({
  value,
  length = 4,
  onDigit,
  onBackspace,
  onConfirm,
  disabled,
}: {
  value: string;
  length?: number;
  onDigit: (d: string) => void;
  onBackspace: () => void;
  onConfirm: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="w-full max-w-xs">
      <div className="mb-6 flex justify-center gap-4">
        {Array.from({ length }).map((_, i) => (
          <span
            key={i}
            className={`h-4 w-4 rounded-full border-2 border-slate-400 ${
              i < value.length ? "bg-slate-700 border-slate-700" : "bg-transparent"
            }`}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {KEYS.map((key) => {
          if (key === "borrar") {
            return (
              <button
                key={key}
                type="button"
                disabled={disabled}
                onClick={onBackspace}
                className="btn-big bg-slate-100 text-slate-600 text-base"
              >
                ⌫
              </button>
            );
          }
          if (key === "ok") {
            return (
              <button
                key={key}
                type="button"
                disabled={disabled || value.length !== length}
                onClick={onConfirm}
                className="btn-big bg-organizador text-white"
              >
                OK
              </button>
            );
          }
          return (
            <button
              key={key}
              type="button"
              disabled={disabled || value.length >= length}
              onClick={() => onDigit(key)}
              className="btn-big bg-white ring-1 ring-slate-200 text-2xl"
            >
              {key}
            </button>
          );
        })}
      </div>
    </div>
  );
}
