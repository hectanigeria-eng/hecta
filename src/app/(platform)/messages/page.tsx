import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { MessagesScreen } from "@/features/messaging/messages-screen";

export const metadata: Metadata = {
  title: "Messages — Hecta",
  description: "Chat with landlords about the homes you've applied for.",
  robots: { index: false },
};

export default function MessagesPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6 md:py-8">
      <h1 className="font-heading text-2xl font-bold text-ink">Messages</h1>
      <div className="mt-6">
        <Suspense
          fallback={
            <div className="grid gap-4 md:grid-cols-[320px_1fr]" aria-hidden>
              <Skeleton className="h-96 w-full rounded-3xl" />
              <Skeleton className="hidden h-96 w-full rounded-3xl md:block" />
            </div>
          }
        >
          <MessagesScreen viewerRole="seeker" />
        </Suspense>
      </div>
    </div>
  );
}
