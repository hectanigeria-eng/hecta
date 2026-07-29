import type { Metadata } from "next";
import { MyListingsTable } from "@/features/dashboard/my-listings-table";

export const metadata: Metadata = {
  title: "My listings — Hecta",
  description: "Manage your property listings and their availability status.",
  robots: { index: false },
};

export default function DashboardListingsPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <h1 className="font-heading text-2xl font-bold text-ink">My listings</h1>
      <MyListingsTable />
    </div>
  );
}
