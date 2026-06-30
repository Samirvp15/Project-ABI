import type { DashboardWidget, WidgetType } from "@/types/dashboard";

const AXIS_LABEL_COLOR = "#64748b";

type AxisLabelConfig = {
  value: string;
  position: "bottom" | "left";
  offset: number;
  angle?: number;
  style: {
    fontSize: number;
    fill: string;
    fontWeight: number;
    textAnchor?: string;
  };
};

function humanizeColumn(name: string | null | undefined): string {
  if (!name) return "";
  return String(name).replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function metricAxisLabel(yColumn: string | null | undefined, aggregation: string): string {
  if (!yColumn) return "Cantidad de registros";
  const label = humanizeColumn(yColumn);
  if (aggregation === "avg") return `Promedio de ${label}`;
  if (aggregation === "sum") return `Suma de ${label}`;
  if (aggregation === "count") return `Conteo de ${label}`;
  return label;
}

function fallbackAxisLabels(
  chartType: WidgetType | string,
  config: Record<string, string | null>,
): { xLabel?: string; yLabel?: string } {
  const aggregation = String(config.aggregation ?? "sum");
  const xCol = config.x_column ?? config.label_column ?? config.column;
  const yCol = config.y_column ?? config.value_column;

  if (chartType === "histogram") {
    return {
      xLabel: humanizeColumn(xCol),
      yLabel: "Frecuencia",
    };
  }

  if (chartType === "scatter") {
    return {
      xLabel: humanizeColumn(xCol),
      yLabel: humanizeColumn(yCol),
    };
  }

  if (chartType === "horizontal_bar") {
    return {
      xLabel: metricAxisLabel(yCol, aggregation),
      yLabel: humanizeColumn(xCol),
    };
  }

  if (chartType === "line" || chartType === "area") {
    return {
      xLabel: humanizeColumn(xCol ?? "Fecha"),
      yLabel: metricAxisLabel(yCol, aggregation),
    };
  }

  if (chartType === "bar") {
    return {
      xLabel: humanizeColumn(xCol),
      yLabel: metricAxisLabel(yCol, aggregation),
    };
  }

  return {};
}

export function getChartAxisLabels(widget: DashboardWidget) {
  const fallback = fallbackAxisLabels(widget.type, widget.config);
  const xLabel = widget.config.x_label
    ? String(widget.config.x_label)
    : fallback.xLabel;
  const yLabel = widget.config.y_label
    ? String(widget.config.y_label)
    : fallback.yLabel;

  const labelStyle = {
    fontSize: 12,
    fill: AXIS_LABEL_COLOR,
    fontWeight: 600,
  };

  const xAxisLabel: AxisLabelConfig | undefined = xLabel
    ? {
        value: xLabel,
        position: "bottom",
        offset: 4,
        style: labelStyle,
      }
    : undefined;

  const yAxisLabel: AxisLabelConfig | undefined = yLabel
    ? {
        value: yLabel,
        angle: -90,
        position: "left",
        offset: 0,
        style: {
          ...labelStyle,
          textAnchor: "middle",
        },
      }
    : undefined;

  return { xLabel, yLabel, xAxisLabel, yAxisLabel };
}

export function chartMarginsWithLabels(
  hasXLabel: boolean,
  hasYLabel: boolean,
  options?: { angledXTicks?: boolean },
) {
  const angledXTicks = options?.angledXTicks ?? false;

  return {
    top: 12,
    right: 16,
    left: hasYLabel ? 24 : 8,
    bottom: (hasXLabel ? 32 : 12) + (angledXTicks ? 36 : 0),
  };
}
