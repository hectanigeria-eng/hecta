import type { ReactNode } from "react";
import { PlatformHeader } from "@/components/layout/platform-header";
import { Toaster } from "@/components/ui/sonner";

// Route group only — keeps seeker/platform URLs top-level ("/search", not
// "/platform/search"). No <html>/<body> here; those live in the root layout.
export default function PlatformLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-canvas">
      <PlatformHeader />
      <main>{children}</main>
      <Toaster />
    </div>
  );
}
