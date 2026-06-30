"use client";

import { Loader2, MessageSquare, Send, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { ChatMessage } from "@/components/chat/chat-message";
import { ChatChartsSection } from "@/components/chat/chat-charts-section";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useChatMessages, useChatSessions, useSendChatMessage } from "@/hooks/use-ai-chat";
import { cn } from "@/lib/utils";
import type { ChatChartWidget } from "@/types/ai";

const SUGGESTIONS = [
  "Resume este dataset",
  "¿Cuántos registros hay en total?",
  "Muéstrame los gráficos disponibles",
  "Gráfico de barras por categoría",
];

interface ChatPanelProps {
  datasetId: string;
  datasetName: string;
}

export function ChatPanel({ datasetId, datasetName }: ChatPanelProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [liveCharts, setLiveCharts] = useState<ChatChartWidget[] | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: sessions } = useChatSessions(datasetId);
  const effectiveSessionId = sessionId ?? sessions?.[0]?.id ?? null;
  const { data: messages = [], isLoading: loadingHistory } = useChatMessages(effectiveSessionId);
  const sendMessage = useSendChatMessage(datasetId);

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const showLiveCharts = !!liveCharts?.length && !lastAssistant?.charts?.length;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sendMessage.isPending, liveCharts]);

  useEffect(() => {
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
    if (lastAssistant?.charts?.length) {
      setLiveCharts(null);
    }
  }, [messages]);

  const handleSend = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || sendMessage.isPending) return;

      setError(null);
      setInput("");

      try {
        const response = await sendMessage.mutateAsync({
          message: trimmed,
          session_id: effectiveSessionId,
        });
        setSessionId(response.session_id);
        if (response.charts?.length) {
          setLiveCharts(response.charts);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al enviar mensaje");
      }
    },
    [sendMessage, effectiveSessionId],
  );

  return (
    <Card className="flex h-[calc(100vh-12rem)] min-h-[520px] flex-col border-0 bg-card/80 shadow-sm">
      <CardHeader className="shrink-0 border-b pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5 text-violet-600" />
          Chat con {datasetName}
        </CardTitle>
        <CardDescription>
          Pregunta sobre tus datos, pide gráficos del dashboard o un resumen del dataset. La IA
          responde con SQL, visualizaciones y explicaciones.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col gap-4 p-0">
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {loadingHistory && effectiveSessionId && (
            <p className="text-center text-sm text-muted-foreground">Cargando historial…</p>
          )}

          {!effectiveSessionId && messages.length === 0 && !sendMessage.isPending && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-4 rounded-full bg-violet-500/10 p-4">
                <Sparkles className="h-8 w-8 text-violet-600" />
              </div>
              <h3 className="font-semibold">Empieza una conversación</h3>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Ejemplo: &quot;¿Cuál fue mi mejor mes de ventas?&quot;
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <Button
                    key={s}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleSend(s)}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}

          {showLiveCharts && liveCharts && (
            <div className="flex gap-3">
              <div className="h-8 w-8 shrink-0" />
              <ChatChartsSection charts={liveCharts} />
            </div>
          )}

          {sendMessage.isPending && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Analizando datos…
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {error && (
          <div className="mx-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <form
          className="shrink-0 border-t p-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
        >
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu pregunta sobre el dataset…"
              rows={2}
              disabled={sendMessage.isPending}
              className={cn(
                "flex-1 resize-none rounded-lg border bg-background px-3 py-2 text-sm",
                "outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
              )}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(input);
                }
              }}
            />
            <Button type="submit" disabled={!input.trim() || sendMessage.isPending} className="shrink-0">
              {sendMessage.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
