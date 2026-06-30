"use client";

import { ChevronDown, ChevronUp, Code2, User } from "lucide-react";
import { useState } from "react";

import { ChatChartsSection } from "@/components/chat/chat-charts-section";
import { ChatFollowUpSuggestions } from "@/components/chat/chat-follow-up-suggestions";
import { resolveMessageCharts } from "@/components/chat/resolve-message-charts";
import { cn } from "@/lib/utils";
import type { ChatMessageItem } from "@/types/ai";

interface ChatMessageProps {
  message: ChatMessageItem;
  onSuggestionSelect?: (suggestion: string) => void;
  suggestionsDisabled?: boolean;
}

export function ChatMessage({
  message,
  onSuggestionSelect,
  suggestionsDisabled = false,
}: ChatMessageProps) {
  const [showSql, setShowSql] = useState(false);
  const isUser = message.role === "user";
  const charts = resolveMessageCharts(message);
  const hasCharts = !isUser && charts.length > 0;
  const suggestions = !isUser && message.suggestions?.length ? message.suggestions : [];
  const showTable =
    !isUser &&
    !hasCharts &&
    Array.isArray(message.result_json) &&
    message.result_json.length > 0;

  return (
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-primary text-primary-foreground" : "bg-violet-500/15 text-violet-600",
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <span className="text-xs font-bold">AI</span>}
      </div>

      <div className={cn("min-w-0 flex-1 space-y-2", isUser && "flex flex-col items-end")}>
        <div
          className={cn(
            "inline-block max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
            isUser
              ? "bg-primary text-primary-foreground"
              : "border bg-card text-foreground shadow-sm",
            !isUser && "whitespace-pre-wrap",
          )}
        >
          {message.content}
        </div>

        {!isUser && message.sql_generated && (
          <div className="w-full max-w-full text-left">
            <button
              type="button"
              onClick={() => setShowSql((v) => !v)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <Code2 className="h-3.5 w-3.5" />
              Ver SQL generado
              {showSql ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
            {showSql && (
              <pre className="mt-2 overflow-x-auto rounded-lg border bg-muted/40 p-3 text-left text-xs">
                {message.sql_generated}
              </pre>
            )}
          </div>
        )}

        {hasCharts && <ChatChartsSection charts={charts} />}

        {showTable && (
          <div className="w-full max-w-full overflow-x-auto rounded-lg border text-left text-xs">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/40">
                  {Object.keys(message.result_json![0]).map((key) => (
                    <th key={key} className="px-2 py-1.5 font-medium">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {message.result_json!.slice(0, 5).map((row, idx) => (
                  <tr key={idx} className="border-b last:border-0">
                    {Object.values(row).map((val, colIdx) => (
                      <td key={colIdx} className="px-2 py-1.5 tabular-nums">
                        {String(val ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {message.result_json!.length > 5 && (
              <p className="px-2 py-1 text-muted-foreground">
                +{message.result_json!.length - 5} filas más
              </p>
            )}
          </div>
        )}

        {suggestions.length > 0 && onSuggestionSelect && (
          <ChatFollowUpSuggestions
            suggestions={suggestions}
            onSelect={onSuggestionSelect}
            disabled={suggestionsDisabled}
          />
        )}
      </div>
    </div>
  );
}
