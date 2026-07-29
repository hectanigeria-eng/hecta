import type { Metadata } from "next";
import { VerificationQueue } from "@/features/admin/verification-queue";

export const metadata: Metadata = {
  title: "Verification review — Hecta Admin",
  description: "Review landlord ownership documents and grant verification.",
  robots: { index: false },
};

export default function AdminVerificationsPage() {
  return (
    <div className="flex w-full flex-col gap-8">
      <h1 className="font-heading text-2xl font-bold text-ink">
        Verifications
      </h1>
      <VerificationQueue />
    </div>
  );
}
