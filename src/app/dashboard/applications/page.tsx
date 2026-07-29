import type { Metadata } from "next";
import { ApplicationsInbox } from "@/features/dashboard/applications-inbox";

export const metadata: Metadata = {
  title: "Applications — Hecta landlord dashboard",
  description: "Review and respond to applications on your listings.",
  robots: { index: false },
};

export default function DashboardApplicationsPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <h1 className="font-heading text-2xl font-bold text-ink">Applications</h1>
      <ApplicationsInbox />
    </div>
  );
}
