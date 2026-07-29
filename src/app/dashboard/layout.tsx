"use client";

import {
  ChatCircleIcon,
  HouseLineIcon,
  PaperPlaneTiltIcon,
  SealCheckIcon,
  SquaresFourIcon,
} from "@phosphor-icons/react";
import type { ReactNode } from "react";
import type { DashboardNavItem } from "@/components/layout/dashboard-sidebar";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { Toaster } from "@/components/ui/sonner";
import { PersonaGuard } from "@/features/dashboard/persona-guard";
import { useSession } from "@/hooks/use-session";
import { useHectaStore } from "@/lib/store";

// Not a Server Component: the "Applications" badge counts replies pending
// on the signed-in landlord's own listings, which only exists in the
// client-side demo store (there is no server session to read it from).
export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user } = useSession();
  const listings = useHectaStore((state) => state.listings);
  const applications = useHectaStore((state) => state.applications);

  const myListingIds = new Set(
    listings
      .filter((listing) => listing.landlordId === user.id)
      .map((listing) => listing.id),
  );
  const awaitingReplyCount = applications.filter(
    (application) =>
      myListingIds.has(application.listingId) &&
      (application.status === "submitted" || application.status === "viewed"),
  ).length;

  const items: DashboardNavItem[] = [
    {
      href: "/dashboard",
      label: "Overview",
      icon: <SquaresFourIcon className="size-5" />,
    },
    {
      href: "/dashboard/listings",
      label: "My listings",
      icon: <HouseLineIcon className="size-5" />,
    },
    {
      href: "/dashboard/applications",
      label: "Applications",
      icon: <PaperPlaneTiltIcon className="size-5" />,
      badge: awaitingReplyCount,
    },
    {
      href: "/dashboard/messages",
      label: "Messages",
      icon: <ChatCircleIcon className="size-5" />,
    },
    {
      href: "/dashboard/verification",
      label: "Verification",
      icon: <SealCheckIcon className="size-5" />,
    },
  ];

  return (
    <>
      <PersonaGuard persona="landlord">
        <DashboardSidebar title="Hecta · Landlord" items={items}>
          {children}
        </DashboardSidebar>
      </PersonaGuard>
      <Toaster />
    </>
  );
}
