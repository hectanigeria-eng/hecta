"use client";

import { SealCheckIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useHydrated } from "@/hooks/use-hydrated";
import { useSession } from "@/hooks/use-session";
import { formatDate } from "@/lib/format";
import { useHectaStore } from "@/lib/store";

/**
 * Trust Layer 1 status, front and centre on the overview: a verified badge
 * builds the confidence seekers need to trust a listing isn't a ghost or a
 * scam, so an unverified landlord gets a clear call to action instead of a
 * quiet nudge buried in a settings page.
 */
export function VerificationStatusCard() {
  const hydrated = useHydrated();
  const { user, isLandlordVerified } = useSession();
  const verifications = useHectaStore((state) => state.verifications);

  if (!hydrated) {
    return <Skeleton className="h-24 w-full rounded-2xl" aria-hidden />;
  }

  if (isLandlordVerified) {
    const approvedAt = verifications
      .filter(
        (verification) =>
          verification.landlordId === user.id &&
          verification.status === "approved",
      )
      .sort(
        (a, b) =>
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
      )
      .at(0)?.submittedAt;

    return (
      <Card
        size="sm"
        className="rounded-2xl bg-primary-50 ring-1 ring-primary-200"
      >
        <CardContent className="flex items-center gap-4">
          <SealCheckIcon
            weight="fill"
            aria-hidden
            className="size-9 shrink-0 text-primary-600"
          />
          <div>
            <p className="font-heading text-base font-bold text-primary-900">
              Verified landlord
            </p>
            <p className="text-sm text-primary-800">
              {approvedAt === undefined
                ? "Seekers see your Verified badge on every listing."
                : `Approved ${formatDate(approvedAt)} — seekers see your Verified badge on every listing.`}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      size="sm"
      className="rounded-2xl bg-secondary-50 ring-1 ring-secondary-300"
    >
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-heading text-base font-bold text-secondary-900">
            Get verified
          </p>
          <p className="text-sm text-secondary-800">
            Verified landlords earn a trust badge seekers can see and get more
            replies.
          </p>
        </div>
        <Button
          asChild
          className="h-11 shrink-0 rounded-full text-sm font-semibold tracking-normal normal-case"
        >
          <Link href="/dashboard/verification">Start verification</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
