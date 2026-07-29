import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { MessagesScreen } from "@/features/messaging/messages-screen";

export const metadata: Metadata = {
  title: "Messages — Hecta landlord dashboard",
  description: "Chat with seekers about the homes you've listed.",
  robots: { index: false },
};

export default function DashboardMessagesPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <h1 className="font-heading text-2xl font-bold text-ink">Messages</h1>
      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-[320px_1fr]" aria-hidden>
            <Skeleton className="h-96 w-full rounded-3xl" />
            <Skeleton className="hidden h-96 w-full rounded-3xl md:block" />
          </div>
        }
      >
        <MessagesScreen viewerRole="landlord" />
      </Suspense>
    </div>
  );
}
