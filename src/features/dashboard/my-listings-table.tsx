"use client";

import { DotsThreeVerticalIcon, HouseLineIcon } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ListingStatusChip } from "@/features/dashboard/listing-status-chip";
import { useHydrated } from "@/hooks/use-hydrated";
import { useSession } from "@/hooks/use-session";
import {
  formatNaira,
  formatRelativeDays,
  pricePeriodLabel,
} from "@/lib/format";
import { useHectaStore } from "@/lib/store";
import type { Listing } from "@/lib/types";

/**
 * Full landlord "my listings" management surface: a real `<table>` on `md`
 * and up, stacked `Card`s below it, sharing one row-actions menu and one
 * empty state. Editing is out of scope for this build (Task 16 owns
 * creation, no task in this pass owns editing an existing listing), so the
 * menu always surfaces a disabled "Edit" item rather than omitting it
 * outright — the absence reads as intentional, not as a missing feature.
 */
export function MyListingsTable() {
  const hydrated = useHydrated();
  const { user } = useSession();
  const listings = useHectaStore((state) => state.listings);
  const setListingStatus = useHectaStore((state) => state.setListingStatus);
  const confirmAvailability = useHectaStore(
    (state) => state.confirmAvailability,
  );

  if (!hydrated) {
    return <MyListingsTableSkeleton />;
  }

  const mine = listings
    .filter((listing) => listing.landlordId === user.id)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  function handleMarkLet(listing: Listing) {
    setListingStatus(listing.id, "let");
    toast.info(`Marked "${listing.title}" as let — hidden from search.`);
  }

  function handleMarkSold(listing: Listing) {
    setListingStatus(listing.id, "sold");
    toast.info(`Marked "${listing.title}" as sold — hidden from search.`);
  }

  function handleReactivate(listing: Listing) {
    confirmAvailability(listing.id);
    setListingStatus(listing.id, "active");
    toast.success(`"${listing.title}" reactivated — visible in search again.`);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end">
        <Button
          asChild
          className="h-11 rounded-full px-5 text-xs font-semibold tracking-normal normal-case"
        >
          <Link href="/dashboard/listings/new">+ New listing</Link>
        </Button>
      </div>

      {mine.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <HouseLineIcon weight="duotone" className="size-12 text-muted-ink" />
          <h2 className="font-heading text-lg font-semibold text-ink">
            No listings yet
          </h2>
          <p className="max-w-sm text-sm text-muted-ink">
            Create your first listing to start receiving applications from
            seekers.
          </p>
          <Button
            asChild
            className="mt-2 h-11 rounded-full px-6 text-sm font-semibold tracking-normal normal-case"
          >
            <Link href="/dashboard/listings/new">+ New listing</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl ring-1 ring-border md:block">
            <Table>
              <TableCaption className="sr-only">
                Your property listings, with status, price, freshness, and
                available actions
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Listing</TableHead>
                  <TableHead scope="col">Status</TableHead>
                  <TableHead scope="col">Price</TableHead>
                  <TableHead scope="col">Updated</TableHead>
                  <TableHead scope="col">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mine.map((listing) => (
                  <TableRow key={listing.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-paper-2">
                          <Image
                            src={listing.images[0]}
                            alt=""
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        </div>
                        <span className="max-w-64 truncate text-sm font-semibold whitespace-normal text-ink">
                          {listing.title}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <ListingStatusChip status={listing.status} />
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-semibold text-ink">
                        {formatNaira(listing.price)}
                      </span>
                      <span className="text-xs text-muted-ink">
                        {pricePeriodLabel(listing.pricePeriod)}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-ink">
                      {formatRelativeDays(listing.lastConfirmedAvailableAt)}
                    </TableCell>
                    <TableCell>
                      <ListingActionsMenu
                        listing={listing}
                        onMarkLet={handleMarkLet}
                        onMarkSold={handleMarkSold}
                        onReactivate={handleReactivate}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <ul className="flex list-none flex-col gap-3 p-0 md:hidden">
            {mine.map((listing) => (
              <li key={listing.id}>
                <Card size="sm" className="rounded-2xl ring-1 ring-border">
                  <CardContent className="flex items-start gap-3">
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-paper-2">
                      <Image
                        src={listing.images[0]}
                        alt=""
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">
                        {listing.title}
                      </p>
                      <div className="mt-1.5">
                        <ListingStatusChip status={listing.status} />
                      </div>
                      <p className="mt-1.5 text-sm font-semibold text-ink">
                        {formatNaira(listing.price)}
                        <span className="text-xs font-normal text-muted-ink">
                          {pricePeriodLabel(listing.pricePeriod)}
                        </span>
                      </p>
                      <p className="text-xs text-muted-ink">
                        Updated{" "}
                        {formatRelativeDays(listing.lastConfirmedAvailableAt)}
                      </p>
                    </div>
                    <ListingActionsMenu
                      listing={listing}
                      onMarkLet={handleMarkLet}
                      onMarkSold={handleMarkSold}
                      onReactivate={handleReactivate}
                    />
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

interface ListingActionsMenuProps {
  listing: Listing;
  onMarkLet: (listing: Listing) => void;
  onMarkSold: (listing: Listing) => void;
  onReactivate: (listing: Listing) => void;
}

function ListingActionsMenu({
  listing,
  onMarkLet,
  onMarkSold,
  onReactivate,
}: ListingActionsMenuProps) {
  const isActive = listing.status === "active";
  const canReactivate =
    listing.status === "hidden" ||
    listing.status === "let" ||
    listing.status === "sold";
  const hasLeadingActions = isActive || canReactivate;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          aria-label={`Actions for ${listing.title}`}
          className="rounded-full"
        >
          <DotsThreeVerticalIcon weight="bold" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {isActive && (
          <DropdownMenuItem asChild>
            <Link href={`/listings/${listing.id}`}>View</Link>
          </DropdownMenuItem>
        )}
        {isActive && listing.intent === "rent" && (
          <DropdownMenuItem onSelect={() => onMarkLet(listing)}>
            Mark as let
          </DropdownMenuItem>
        )}
        {isActive && listing.intent === "buy" && (
          <DropdownMenuItem onSelect={() => onMarkSold(listing)}>
            Mark as sold
          </DropdownMenuItem>
        )}
        {canReactivate && (
          <DropdownMenuItem onSelect={() => onReactivate(listing)}>
            Reactivate
          </DropdownMenuItem>
        )}
        {hasLeadingActions && <DropdownMenuSeparator />}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {/* The wrapping span (not the disabled item itself) carries the
               * hover/focus surface: Radix marks a disabled item
               * `pointer-events-none`, which would otherwise stop the
               * tooltip's own hover detection from ever firing. */}
              <span className="block cursor-not-allowed">
                <DropdownMenuItem
                  disabled
                  onSelect={(event) => event.preventDefault()}
                  aria-label="Edit — editing coming soon"
                >
                  Edit
                </DropdownMenuItem>
              </span>
            </TooltipTrigger>
            <TooltipContent>Editing coming soon</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MyListingsTableSkeleton() {
  const keys = Array.from(
    { length: 4 },
    (_, index) => `listing-skeleton-${index}`,
  );
  return (
    <div className="flex flex-col gap-3" aria-hidden>
      {keys.map((key) => (
        <Skeleton key={key} className="h-20 w-full rounded-2xl" />
      ))}
    </div>
  );
}
