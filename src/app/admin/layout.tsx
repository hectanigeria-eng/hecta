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
import {
  openReportCount,
  pendingListingCount,
  pendingVerificationCount,
} from "@/lib/admin";
import { useHectaStore } from "@/lib/store";

// Not a Server Component: every badge count here comes from the client-side
// demo store (verifications, listings, reports), which has no server-side
// session to read from. Mirrors `src/app/dashboard/layout.tsx`.
export default function AdminLayout({ children }: { children: ReactNode }) {
  const verifications = useHectaStore((state) => state.verifications);
  const listings = useHectaStore((state) => state.listings);
  const reports = useHectaStore((state) => state.reports);

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
      badge: pendingVerificationCount(verifications),
    },
    {
      href: "/admin/listings",
      label: "Listing approvals",
      icon: <HouseLineIcon className="size-5" />,
      badge: pendingListingCount(listings),
    },
    {
      href: "/admin/reports",
      label: "Reports",
      icon: <FlagIcon className="size-5" />,
      badge: openReportCount(reports),
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
