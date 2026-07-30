import type { Metadata } from "next";
import { ListingApprovalQueue } from "@/features/admin/listing-approval-queue";

export const metadata: Metadata = {
  title: "Listing approvals — Hecta Admin",
  description: "Review new listings for suspicious pricing and completeness.",
  robots: { index: false },
};

export default function AdminListingsPage() {
  return (
    <div className="flex w-full flex-col gap-8">
      <h1 className="font-heading text-2xl font-bold text-ink">
        Listing approvals
      </h1>
      <ListingApprovalQueue />
    </div>
  );
}
