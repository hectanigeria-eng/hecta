"use client";

import { ChatCircleDotsIcon } from "@phosphor-icons/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatView } from "@/features/messaging/chat-view";
import { ThreadList } from "@/features/messaging/thread-list";
import { useHydrated } from "@/hooks/use-hydrated";
import { useSession } from "@/hooks/use-session";
import { useHectaStore } from "@/lib/store";
import type { ChatMessage, Listing, MessageThread } from "@/lib/types";
import { cn } from "@/lib/utils";

export type MessagingRole = "seeker" | "landlord";

/**
 * A thread enriched with everything both the list row and the chat header
 * need to render, so neither child re-derives it from raw store state.
 */
export interface ThreadSummary {
  thread: MessageThread;
  listing: Listing | undefined;
  counterpartyName: string;
  lastMessage: ChatMessage | undefined;
}

interface MessagesScreenProps {
  /**
   * Which half of `MessageThread.participantIds` ("[applicantId,
   * landlordId]") the active user occupies. This single prop is the whole
   * reuse contract: it decides which threads belong to "me" and which
   * participant is rendered as the counterparty — everything else (layout,
   * selection, sending) is identical for both sides.
   */
  role: MessagingRole;
}

/**
 * Mounted at `/messages` for the seeker (Task 13) and `/dashboard/messages`
 * for the landlord (Task 15) — built once and reused verbatim. The active
 * thread is derived from the `?thread=` query param on whatever pathname
 * this happens to be rendered at, so the caller needs nothing beyond `role`.
 */
export function MessagesScreen({ role }: MessagesScreenProps) {
  const hydrated = useHydrated();
  const { user } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const threads = useHectaStore((state) => state.threads);
  const messages = useHectaStore((state) => state.messages);
  const listings = useHectaStore((state) => state.listings);
  const users = useHectaStore((state) => state.users);

  const mySlot = role === "seeker" ? 0 : 1;
  const counterpartySlot = role === "seeker" ? 1 : 0;

  const summaries = useMemo<ThreadSummary[]>(() => {
    const mine = threads.filter(
      (thread) => thread.participantIds[mySlot] === user.id,
    );
    const enriched = mine.map((thread) => {
      const threadMessages = messages
        .filter((message) => message.threadId === thread.id)
        .sort(
          (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
        );
      const lastMessage = threadMessages.at(-1);
      const counterpartyId = thread.participantIds[counterpartySlot];
      const counterpartyName =
        users.find((candidate) => candidate.id === counterpartyId)?.name ??
        "Hecta user";
      return {
        thread,
        listing: listings.find((listing) => listing.id === thread.listingId),
        counterpartyName,
        lastMessage,
      };
    });
    // Threads with no messages yet (just unlocked, nobody has said anything)
    // surface first — they need a reply more than an old, settled thread.
    return enriched.sort((a, b) => {
      const aTime = a.lastMessage
        ? new Date(a.lastMessage.sentAt).getTime()
        : Number.POSITIVE_INFINITY;
      const bTime = b.lastMessage
        ? new Date(b.lastMessage.sentAt).getTime()
        : Number.POSITIVE_INFINITY;
      return bTime - aTime;
    });
  }, [threads, messages, listings, users, user.id, mySlot, counterpartySlot]);

  const requestedThreadId = searchParams.get("thread") ?? undefined;
  const activeSummary = summaries.find(
    (summary) => summary.thread.id === requestedThreadId,
  );

  function handleBack() {
    router.push(pathname);
  }

  if (!hydrated) {
    return <MessagesScreenSkeleton />;
  }

  if (summaries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <ChatCircleDotsIcon
          weight="duotone"
          className="size-12 text-muted-ink"
        />
        <p className="max-w-sm text-sm text-muted-ink">
          Messages unlock when an application is accepted or a landlord
          responds.
        </p>
      </div>
    );
  }

  const activeMessages =
    activeSummary === undefined
      ? []
      : messages
          .filter((message) => message.threadId === activeSummary.thread.id)
          .sort(
            (a, b) =>
              new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
          );

  return (
    <div className="grid h-[calc(100dvh-13rem)] overflow-hidden rounded-3xl ring-1 ring-border md:h-[600px] md:grid-cols-[320px_1fr]">
      <div
        className={cn(
          "h-full border-border md:block md:border-r",
          activeSummary !== undefined ? "hidden" : "block",
        )}
      >
        <ThreadList
          summaries={summaries}
          activeThreadId={activeSummary?.thread.id}
          pathname={pathname}
        />
      </div>
      <div
        className={cn(
          "h-full md:flex md:flex-col",
          activeSummary !== undefined ? "flex flex-col" : "hidden",
        )}
      >
        {activeSummary !== undefined ? (
          <ChatView
            summary={activeSummary}
            messages={activeMessages}
            activeUserId={user.id}
            onBack={handleBack}
          />
        ) : (
          <div className="hidden h-full flex-1 items-center justify-center p-8 text-center text-sm text-muted-ink md:flex">
            Select a conversation to view messages.
          </div>
        )}
      </div>
    </div>
  );
}

function MessagesScreenSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-[320px_1fr]" aria-hidden>
      <Skeleton className="h-96 w-full rounded-3xl" />
      <Skeleton className="hidden h-96 w-full rounded-3xl md:block" />
    </div>
  );
}
