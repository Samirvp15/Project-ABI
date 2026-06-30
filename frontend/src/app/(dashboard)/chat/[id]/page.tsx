"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { use } from "react";

import { ChatPanel } from "@/components/chat/chat-panel";
import { buttonVariants } from "@/components/ui/button";
import { useDataset } from "@/hooks/use-datasets";
import { cn } from "@/lib/utils";

export default function ChatDatasetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: dataset, isLoading } = useDataset(id);

  if (isLoading) {
    return <div className="h-96 animate-pulse rounded-2xl bg-muted/60" />;
  }

  if (!dataset) {
    return (
      <div className="py-16 text-center">
        <p className="text-destructive">Dataset no encontrado</p>
        <Link href="/chat" className={cn(buttonVariants({ variant: "link" }), "mt-2")}>
          Volver al chat
        </Link>
      </div>
    );
  }

  if (dataset.status !== "ready") {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Este dataset aún no está listo para el chat.</p>
        <Link href="/chat" className={cn(buttonVariants({ variant: "link" }), "mt-2")}>
          Elegir otro dataset
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      <Link
        href="/chat"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1")}
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a datasets
      </Link>
      <ChatPanel datasetId={id} datasetName={dataset.name} />
    </div>
  );
}
