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
      <header className="flex flex-col gap-1.5">
        <h1 className="font-heading text-2xl font-bold text-ink">
          List your property
        </h1>
        <p className="text-sm text-muted-ink">
          Seven short steps. Everything you enter is kept as you move between
          them.
        </p>
      </header>
      <NewListingWizard />
    </div>
  );
}
