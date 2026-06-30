"use client";

import { MessageCircleQuestion } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ChatFollowUpSuggestionsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  disabled?: boolean;
}

export function ChatFollowUpSuggestions({
  suggestions,
  onSelect,
  disabled = false,
}: ChatFollowUpSuggestionsProps) {
  if (!suggestions.length) return null;

  return (
    <div className="w-full max-w-3xl space-y-2 text-left">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <MessageCircleQuestion className="h-3.5 w-3.5" />
        Puedes seguir con:
      </p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <Button
            key={suggestion}
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            className="h-auto whitespace-normal px-3 py-1.5 text-left text-xs leading-snug"
            onClick={() => onSelect(suggestion)}
          >
            {suggestion}
          </Button>
        ))}
      </div>
    </div>
  );
}
