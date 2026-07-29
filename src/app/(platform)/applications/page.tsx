import type { Metadata } from "next";
import { ApplicationsList } from "@/features/apply/applications-list";

export const metadata: Metadata = {
  title: "Your applications — Hecta",
  description: "Track the status of homes you've applied for on Hecta.",
  robots: { index: false },
};

export default function ApplicationsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-6 md:py-8">
      <h1 className="font-heading text-2xl font-bold text-ink">
        Your applications
      </h1>
      <div className="mt-6">
        <ApplicationsList />
      </div>
    </div>
  );
}
