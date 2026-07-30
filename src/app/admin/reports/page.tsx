import type { Metadata } from "next";
import { ReportsQueue } from "@/features/admin/reports-queue";

export const metadata: Metadata = {
  title: "Reports — Hecta Admin",
  description: "Review listings flagged by tenants and seekers.",
  robots: { index: false },
};

export default function AdminReportsPage() {
  return (
    <div className="flex w-full flex-col gap-8">
      <h1 className="font-heading text-2xl font-bold text-ink">Reports</h1>
      <ReportsQueue />
    </div>
  );
}
