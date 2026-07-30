import type { Metadata } from "next";
import { NewListingWizard } from "@/features/dashboard/new-listing/wizard";

export const metadata: Metadata = {
  title: "New listing — Hecta",
  description:
    "List your property on Hecta in seven short steps, with every move-in cost disclosed up front.",
  robots: { index: false },
};

export default function NewListingPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <NewListingWizard />
    </div>
  );
}
