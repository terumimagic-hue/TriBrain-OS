"use client";

import { MODES } from "@/lib/modes";
import type { ModeId } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  value: ModeId;
  onChange: (id: ModeId) => void;
  disabled?: boolean;
}

export default function ModeSelector({ value, onChange, disabled }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {MODES.map((m) => (
        <button
          key={m.id}
          type="button"
          disabled={disabled}
          onClick={() => onChange(m.id)}
          className={cn(
            "px-3 py-1.5 rounded-full text-sm border transition",
            value === m.id
              ? "bg-white text-black border-white"
              : "bg-transparent text-zinc-300 border-zinc-700 hover:border-zinc-500",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          title={m.description}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
