"use client";

import {
  FlagIcon,
  HouseLineIcon,
  SealCheckIcon,
  SquaresFourIcon,
} from "@phosphor-icons/react";
import type { ReactNode } from "react";
import type { DashboardNavItem } from "@/components/layout/dashboard-sidebar";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { Toaster } from "@/components/ui/sonner";
import { PersonaGuard } from "@/features/dashboard/persona-guard";
import { useHectaStore } from "@/lib/store";

const ACTIONABLE_VERIFICATION_STATUSES = new Set([
  "submitted",
  "under_review",
  "info_requested",
]);

// Not a Server Component: every badge count here comes from the client-side
// demo store (verifications, listings, reports), which has no server-side
// session to read from. Mirrors `src/app/dashboard/layout.tsx`.
export default function AdminLayout({ children }: { children: ReactNode }) {
  const verifications = useHectaStore((state) => state.verifications);
  const listings = useHectaStore((state) => state.listings);
  const reports = useHectaStore((state) => state.reports);

  const pendingVerificationCount = verifications.filter((verification) =>
    ACTIONABLE_VERIFICATION_STATUSES.has(verification.status),
  ).length;
  const pendingListingCount = listings.filter(
    (listing) => listing.status === "pending_review",
  ).length;
  const openReportCount = reports.filter(
    (report) => report.status === "open",
  ).length;

  const items: DashboardNavItem[] = [
    {
      href: "/admin",
      label: "Overview",
      icon: <SquaresFourIcon className="size-5" />,
    },
    {
      href: "/admin/verifications",
      label: "Verifications",
      icon: <SealCheckIcon className="size-5" />,
      badge: pendingVerificationCount,
    },
    {
      href: "/admin/listings",
      label: "Listing approvals",
      icon: <HouseLineIcon className="size-5" />,
      badge: pendingListingCount,
    },
    {
      href: "/admin/reports",
      label: "Reports",
      icon: <FlagIcon className="size-5" />,
      badge: openReportCount,
    },
  ];

  return (
    <>
      <PersonaGuard persona="admin">
        <DashboardSidebar title="Hecta · Admin" items={items}>
          {children}
        </DashboardSidebar>
      </PersonaGuard>
      <Toaster />
    </>
  );
}
