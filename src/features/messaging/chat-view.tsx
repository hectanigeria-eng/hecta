"use client";

import { CaretLeftIcon, PaperPlaneTiltIcon } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ThreadSummary } from "@/features/messaging/messages-screen";
import { formatDate } from "@/lib/format";
import { useHectaStore } from "@/lib/store";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ChatViewProps {
  summary: ThreadSummary;
  messages: ChatMessage[];
  activeUserId: string;
  /** Clears `?thread=` — only shown on mobile, where the thread list and the
   * chat never share the screen. */
  onBack: () => void;
}

export function ChatView({
  summary,
  messages,
  activeUserId,
  onBack,
}: ChatViewProps) {
  const sendMessage = useHectaStore((state) => state.sendMessage);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the newest message both when a (different) thread is
  // opened and whenever the message count grows (including our own sends).
  // biome-ignore lint/correctness/useExhaustiveDependencies: thread id and message count are re-run triggers, not values read in the body.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [summary.thread.id, messages.length]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = draft.trim();
    if (trimmed.length === 0) return;
    sendMessage(summary.thread.id, trimmed);
    setDraft("");
  }

  const { listing, counterpartyName } = summary;

  return (
    <>
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          onClick={onBack}
          className="-ml-2 md:hidden"
        >
          <CaretLeftIcon />
          <span className="sr-only">Back to conversations</span>
        </Button>
        <div className="relative size-10 shrink-0 overflow-hidden rounded-full bg-paper-2">
          {listing !== undefined && (
            <Image
              src={listing.images[0]}
              alt=""
              fill
              sizes="40px"
              className="object-cover"
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">
            {counterpartyName}
          </p>
          {listing !== undefined ? (
            <Link
              href={`/listings/${listing.id}`}
              className="block truncate text-xs text-muted-ink outline-none hover:text-ink hover:underline focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              {listing.title}
            </Link>
          ) : (
            <p className="truncate text-xs text-muted-ink">
              Listing no longer available
            </p>
          )}
        </div>
      </header>

      <div
        role="log"
        aria-live="polite"
        className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-4"
      >
        {messages.map((message) => {
          const isOwn = message.senderId === activeUserId;
          return (
            <div
              key={message.id}
              className={cn("flex", isOwn ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm",
                  isOwn
                    ? "bg-primary-600 text-primary-foreground"
                    : "border border-border bg-background text-ink",
                )}
              >
                <p className="whitespace-pre-wrap">{message.body}</p>
                <p
                  className={cn(
                    "mt-1 text-[0.65rem]",
                    isOwn ? "text-primary-foreground/70" : "text-muted-ink",
                  )}
                >
                  {formatDate(message.sentAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-border px-4 py-3"
      >
        <Label htmlFor="message-draft" className="sr-only">
          Message
        </Label>
        <Input
          id="message-draft"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Write a message…"
          autoComplete="off"
          className="h-11"
        />
        <Button
          type="submit"
          size="icon-lg"
          disabled={draft.trim().length === 0}
        >
          <PaperPlaneTiltIcon weight="fill" />
          <span className="sr-only">Send message</span>
        </Button>
      </form>
    </>
  );
}
