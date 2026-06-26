import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DashboardWidget } from "@/types/dashboard";

interface KpiWidgetProps {
  widget: DashboardWidget;
}

export function KpiWidget({ widget }: KpiWidgetProps) {
  const data = widget.data as { value?: number; label?: string };
  const value = typeof data.value === "number" ? data.value : 0;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardDescription>{widget.title}</CardDescription>
        <CardTitle className="text-3xl tabular-nums">
          {value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </CardTitle>
      </CardHeader>
    </Card>
  );
}
