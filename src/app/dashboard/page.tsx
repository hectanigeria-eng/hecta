import type { Metadata } from "next";
import { AvailabilityPrompts } from "@/features/dashboard/availability-prompts";
import { OverviewStats } from "@/features/dashboard/overview-stats";
import { VerificationStatusCard } from "@/features/dashboard/verification-status-card";

export const metadata: Metadata = {
  title: "Landlord dashboard — Hecta",
  description: "Manage your listings, applications, and availability status.",
  robots: { index: false },
};

export default function DashboardOverviewPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <h1 className="font-heading text-2xl font-bold text-ink">Overview</h1>
      <VerificationStatusCard />
      <OverviewStats />
      <AvailabilityPrompts />
    </div>
  );
}
