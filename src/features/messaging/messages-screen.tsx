"use client";

import { ChatCircleDotsIcon } from "@phosphor-icons/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type RefObject, useEffect, useMemo, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatView } from "@/features/messaging/chat-view";
import { ThreadList } from "@/features/messaging/thread-list";
import { useHydrated } from "@/hooks/use-hydrated";
import { useSession } from "@/hooks/use-session";
import { useHectaStore } from "@/lib/store";
import type { ChatMessage, Listing, MessageThread } from "@/lib/types";
import { cn } from "@/lib/utils";

export type MessagingRole = "seeker" | "landlord";

/** Tailwind's `md` — where the layout switches to the two-pane desktop view. */
const DESKTOP_MEDIA_QUERY = "(min-width: 48rem)";
/** Designed pane height from `md` up; on phones the pane fills what is left. */
const DESKTOP_PANE_HEIGHT_PX = 600;
/** Below this a thread is unusable, so let the page scroll instead of shrinking further. */
const MIN_PANE_HEIGHT_PX = 320;

/** Padding, border and margin an ancestor keeps *below* its content. */
function bottomInset(element: HTMLElement): number {
  const style = window.getComputedStyle(element);
  return (
    (Number.parseFloat(style.paddingBottom) || 0) +
    (Number.parseFloat(style.borderBottomWidth) || 0) +
    (Number.parseFloat(style.marginBottom) || 0)
  );
}

/**
 * The height the split pane may occupy, measured from the live layout: its own
 * top edge down to the bottom of the viewport, minus whatever padding, border
 * and margin its ancestors keep below it.
 *
 * Measured rather than derived from a hardcoded chrome budget: this screen
 * renders inside two different, responsive shells (the landlord dashboard's
 * floating panel and the seeker's platform header), so any single
 * `100dvh - <constant>` guess drifts out of date and pushes the compose form
 * below the fold — the pane clips its own overflow, so that form becomes
 * unreachable rather than merely off-screen.
 */
function usePaneHeight(
  ref: RefObject<HTMLElement | null>,
  enabled: boolean,
): number | undefined {
  const [height, setHeight] = useState<number>();

  useEffect(() => {
    const pane = ref.current;
    if (!enabled || pane === null) return;

    const measure = (): void => {
      // Document-space offset, so measuring on a scrolled page can only ever
      // under-estimate the space available (safe) instead of over-estimating.
      const top = pane.getBoundingClientRect().top + window.scrollY;
      let insetBelow = 0;
      for (
        let ancestor = pane.parentElement;
        ancestor !== null;
        ancestor = ancestor.parentElement
      ) {
        insetBelow += bottomInset(ancestor);
      }
      const available = window.innerHeight - top - insetBelow;
      const target = window.matchMedia(DESKTOP_MEDIA_QUERY).matches
        ? Math.min(DESKTOP_PANE_HEIGHT_PX, available)
        : available;
      setHeight(Math.max(MIN_PANE_HEIGHT_PX, target));
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [ref, enabled]);

  return height;
}

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
   *
   * Named `viewerRole` (not `role`) because Biome's a11y linter treats a
   * `role` prop as an ARIA role attribute regardless of the component it
   * belongs to.
   */
  viewerRole: MessagingRole;
}

/**
 * Mounted at `/messages` for the seeker (Task 13) and `/dashboard/messages`
 * for the landlord (Task 15) — built once and reused verbatim. The active
 * thread is derived from the `?thread=` query param on whatever pathname
 * this happens to be rendered at, so the caller needs nothing beyond
 * `viewerRole`.
 */
export function MessagesScreen({ viewerRole }: MessagesScreenProps) {
  const hydrated = useHydrated();
  const { user } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const threads = useHectaStore((state) => state.threads);
  const messages = useHectaStore((state) => state.messages);
  const listings = useHectaStore((state) => state.listings);
  const users = useHectaStore((state) => state.users);

  const mySlot = viewerRole === "seeker" ? 0 : 1;
  const counterpartySlot = viewerRole === "seeker" ? 1 : 0;

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

  const paneRef = useRef<HTMLDivElement>(null);
  const paneHeight = usePaneHeight(paneRef, summaries.length > 0);

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
    <div
      ref={paneRef}
      // A measured pixel height has no utility equivalent; the `h-*` classes
      // below are the fallback for the single frame before it is measured.
      style={paneHeight === undefined ? undefined : { height: paneHeight }}
      className="grid h-[60dvh] overflow-hidden rounded-3xl ring-1 ring-border md:h-150 md:grid-cols-[320px_1fr]"
    >
      <div
        className={cn(
          "h-full min-h-0 border-border md:block md:border-r",
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
          "h-full min-h-0 md:flex md:flex-col",
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
