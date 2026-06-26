"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { FALLBACK_CHART_COLORS } from "@/components/charts/chart-colors";

interface PieSlice {
  name: string;
  value: number;
}

interface PieChartInnerProps {
  data: PieSlice[];
  innerRadius?: number;
}

export function PieChartInner({ data, innerRadius = 0 }: PieChartInnerProps) {
  if (!data.length) {
    return (
      <div className="flex h-full min-h-[240px] items-center justify-center text-sm text-muted-foreground">
        Sin datos
      </div>
    );
  }

  return (
    <div className="h-full min-h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="42%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={innerRadius > 0 ? 72 : 88}
            paddingAngle={2}
            isAnimationActive={false}
          >
            {data.map((entry, index) => (
              <Cell
                key={`${entry.name}-${index}`}
                fill={FALLBACK_CHART_COLORS[index % FALLBACK_CHART_COLORS.length]}
                stroke="transparent"
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [
              typeof value === "number"
                ? value.toLocaleString(undefined, { maximumFractionDigits: 2 })
                : String(value ?? ""),
              String(name ?? ""),
            ]}
          />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            iconType="circle"
            wrapperStyle={{ fontSize: 12, lineHeight: "18px", maxWidth: "45%" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
