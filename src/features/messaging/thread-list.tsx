"use client";

import Image from "next/image";
import Link from "next/link";
import type { ThreadSummary } from "@/features/messaging/messages-screen";
import { formatRelativeDays } from "@/lib/format";
import { cn } from "@/lib/utils";

interface ThreadListProps {
  summaries: ThreadSummary[];
  activeThreadId: string | undefined;
  /** Current route pathname — `?thread=` is appended to it, so the same
   * list works whether it's mounted at `/messages` or `/dashboard/messages`. */
  pathname: string;
}

export function ThreadList({
  summaries,
  activeThreadId,
  pathname,
}: ThreadListProps) {
  return (
    <nav aria-label="Conversations" className="h-full overflow-y-auto">
      <ul className="flex list-none flex-col p-0">
        {summaries.map(({ thread, listing, counterpartyName, lastMessage }) => {
          const isActive = thread.id === activeThreadId;
          return (
            <li key={thread.id}>
              <Link
                href={`${pathname}?thread=${thread.id}`}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "flex min-h-16 items-center gap-3 border-b border-border px-4 py-3 outline-none transition-colors hover:bg-paper-2 focus-visible:bg-paper-2 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500",
                  isActive && "bg-primary-50",
                )}
              >
                <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-paper-2">
                  {listing !== undefined && (
                    <Image
                      src={listing.images[0]}
                      alt=""
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">
                    {counterpartyName}
                  </p>
                  <p className="truncate text-xs text-muted-ink">
                    {lastMessage !== undefined
                      ? lastMessage.body
                      : "No messages yet"}
                  </p>
                </div>
                {lastMessage !== undefined && (
                  <span className="shrink-0 self-start text-xs text-muted-ink">
                    {formatRelativeDays(lastMessage.sentAt)}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
