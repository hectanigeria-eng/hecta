import type { Metadata } from "next";
import { LandlordVerification } from "@/features/dashboard/landlord-verification";

export const metadata: Metadata = {
  title: "Verification — Hecta landlord dashboard",
  description: "Verify your identity and property ownership to list on Hecta.",
  robots: { index: false },
};

export default function DashboardVerificationPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <h1 className="font-heading text-2xl font-bold text-ink">Verification</h1>
      <LandlordVerification />
    </div>
  );
}
