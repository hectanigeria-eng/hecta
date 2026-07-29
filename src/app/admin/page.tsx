import type { Metadata } from "next";
import { AdminOverview } from "@/features/admin/admin-overview";

export const metadata: Metadata = {
  title: "Admin overview — Hecta",
  description: "Review queues and recent moderation decisions on Hecta.",
  robots: { index: false },
};

export default function AdminOverviewPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <h1 className="font-heading text-2xl font-bold text-ink">Overview</h1>
      <AdminOverview />
    </div>
  );
}
