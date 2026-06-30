"use client";

import { Loader2 } from "lucide-react";

export function ChatAssistantLoading() {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-violet-600">
        <span className="text-xs font-bold">AI</span>
      </div>
      <div className="inline-flex items-center gap-2 rounded-2xl border bg-card px-4 py-2.5 text-sm text-muted-foreground shadow-sm">
        <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
        Analizando datos y generando respuesta…
      </div>
    </div>
  );
}
