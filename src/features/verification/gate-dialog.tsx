"use client";

import { ShieldCheckIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface GateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * The trust gate. Rendered alongside every `useGate()` call site — closed by
 * default, so mounting several on one page (e.g. one per search result card)
 * costs nothing until that card's own save action opens it.
 */
export function GateDialog({ open, onOpenChange }: GateDialogProps) {
  const pathname = usePathname();
  // Starts as the bare pathname (matches the server render) and picks up the
  // current query string in an effect once mounted in the browser — reading
  // `window.location` directly during render would make the client's first
  // pass disagree with the server-rendered markup for pages with query
  // params (e.g. a filtered /search).
  const [currentPath, setCurrentPath] = useState(pathname);

  useEffect(() => {
    setCurrentPath(`${window.location.pathname}${window.location.search}`);
  }, []);

  const verifyHref = `/verify?next=${encodeURIComponent(currentPath)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl sm:max-w-sm">
        <DialogHeader className="items-center gap-3 text-center">
          <div
            aria-hidden
            className="flex size-14 items-center justify-center rounded-full bg-primary-100"
          >
            <ShieldCheckIcon
              weight="fill"
              className="size-7 text-primary-600"
            />
          </div>
          <DialogTitle className="text-xl font-bold tracking-normal text-ink normal-case">
            Verify once, apply anywhere
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-ink">
            Hecta keeps enquiries serious. Verify your identity in under a
            minute to apply, save homes, and contact landlords — browsing stays
            free.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            asChild
            className="h-11 w-full rounded-full text-sm font-semibold tracking-normal normal-case"
          >
            <Link href={verifyHref}>Verify my identity</Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="h-11 w-full rounded-full text-sm font-semibold tracking-normal text-muted-ink normal-case"
          >
            Not now
          </Button>
        </DialogFooter>

        <p className="text-center text-xs text-muted-ink">
          Demo tip: switching to the Tunde persona skips this.
        </p>
      </DialogContent>
    </Dialog>
  );
}
