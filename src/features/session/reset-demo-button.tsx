"use client";

import { ArrowCounterClockwiseIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useHectaStore } from "@/lib/store";

/**
 * Returns a stable callback that restores the demo store to its seeded
 * state and surfaces a confirmation toast. Shared by `ResetDemoButton` and
 * `PersonaSwitcher`'s "Reset demo data" menu item so the reset behavior and
 * its copy live in one place.
 */
export function useResetDemo(): () => void {
  const resetDemo = useHectaStore((state) => state.resetDemo);

  return () => {
    resetDemo();
    toast.success("Demo data reset", {
      description:
        "Listings, applications, and messages are back to their seeded state.",
    });
  };
}

export function ResetDemoButton({ className }: { className?: string }) {
  const handleReset = useResetDemo();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={className}
      onClick={handleReset}
    >
      <ArrowCounterClockwiseIcon className="size-4" data-icon="inline-start" />
      Reset demo data
    </Button>
  );
}
