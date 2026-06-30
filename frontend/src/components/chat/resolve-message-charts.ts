import type { ChartHint, ChatChartWidget } from "@/types/ai";

export function buildChatWidgetFromResult(
  result: Record<string, unknown>[],
  hint: ChartHint,
): ChatChartWidget | null {
  if (!result.length || hint.type === "none") return null;

  const keys = Object.keys(result[0]);
  const xCol = hint.x_column ?? keys[0];
  let yCol = hint.y_column;
  if (!yCol && keys.length >= 2) {
    yCol = keys[1] === xCol ? keys[0] : keys[1];
  }

  if (hint.type === "pie") {
    const data = result.slice(0, 20).map((row) => ({
      name: String(row[xCol] ?? ""),
      value: Number(row[yCol ?? ""] ?? 0),
    }));
    if (!data.length) return null;
    return {
      id: `chat-fallback-pie-${xCol}`,
      type: "pie",
      title: `Participación por ${xCol}`,
      config: { label_column: xCol, value_column: yCol ?? null, aggregation: "sum" },
      data,
    };
  }

  if (hint.type === "line" || hint.type === "bar") {
    const data = result.slice(0, 50).flatMap((row) => {
      const yVal = row[yCol ?? ""];
      if (yVal == null || yVal === "") return [];
      const num = Number(yVal);
      if (Number.isNaN(num)) return [];
      return [{ x: String(row[xCol] ?? ""), y: num }];
    });
    if (!data.length) return null;
    return {
      id: `chat-fallback-${hint.type}-${xCol}`,
      type: hint.type,
      title: `${yCol ?? "valor"} por ${xCol}`,
      config: { x_column: xCol, y_column: yCol ?? null, aggregation: "sum" },
      data,
    };
  }

  return null;
}

export function resolveMessageCharts(message: {
  charts?: ChatChartWidget[] | null;
  chart_hint?: ChartHint | null;
  result_json?: Record<string, unknown>[] | null;
}): ChatChartWidget[] {
  if (Array.isArray(message.charts) && message.charts.length > 0) {
    return message.charts;
  }
  if (
    message.chart_hint &&
    Array.isArray(message.result_json) &&
    message.result_json.length > 0
  ) {
    const built = buildChatWidgetFromResult(message.result_json, message.chart_hint);
    return built ? [built] : [];
  }
  return [];
}
