"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  onSubmit: (prompt: string) => void;
  loading: boolean;
  debate: boolean;
  onToggleDebate: (v: boolean) => void;
}

export default function PromptInput({
  onSubmit,
  loading,
  debate,
  onToggleDebate
}: Props) {
  const [value, setValue] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || loading) return;
    onSubmit(trimmed);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      const trimmed = value.trim();
      if (!trimmed || loading) return;
      onSubmit(trimmed);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask anything. The council will answer in parallel."
        rows={4}
        className="w-full resize-y rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none"
      />
      <div className="flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-xs text-zinc-400 select-none">
          <input
            type="checkbox"
            checked={debate}
            onChange={(e) => onToggleDebate(e.target.checked)}
            className="accent-purple-500"
          />
          Debate mode (3 rounds — slower, deeper)
        </label>
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className={cn(
            "rounded-xl px-5 py-2 text-sm font-medium transition",
            loading || !value.trim()
              ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
              : "bg-white text-black hover:bg-zinc-200"
          )}
        >
          {loading ? "Convening…" : "Ask the council  ⌘↵"}
        </button>
      </div>
    </form>
  );
}
