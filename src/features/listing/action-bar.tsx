"use client";

import { ChatCircleTextIcon, HeartIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ActionBarProps {
  listingTitle: string;
  isSaved: boolean;
  onApply: () => void;
  onSave: () => void;
  onContact: () => void;
}

/**
 * Purely presentational — every action is a callback so Task 11 can wrap the
 * three of them in the verification gate and Task 12 can swap `onApply` for
 * the real application flow without touching this file.
 */
export function ActionBar({
  listingTitle,
  isSaved,
  onApply,
  onSave,
  onContact,
}: ActionBarProps) {
  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        onClick={onApply}
        className="h-12 w-full rounded-full text-sm font-semibold tracking-normal normal-case"
      >
        Apply for this home
      </Button>
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onSave}
          aria-pressed={isSaved}
          aria-label={
            isSaved
              ? `Remove ${listingTitle} from saved homes`
              : `Save ${listingTitle}`
          }
          className="h-11 gap-1.5 rounded-full border-border bg-card text-sm font-semibold tracking-normal text-ink normal-case hover:bg-paper-2"
        >
          <HeartIcon
            weight={isSaved ? "fill" : "regular"}
            className={cn("size-4", isSaved && "text-primary-600")}
          />
          {isSaved ? "Saved" : "Save"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onContact}
          className="h-11 gap-1.5 rounded-full border-border bg-card text-sm font-semibold tracking-normal text-ink normal-case hover:bg-paper-2"
        >
          <ChatCircleTextIcon weight="regular" className="size-4" />
          Contact
        </Button>
      </div>
    </div>
  );
}
