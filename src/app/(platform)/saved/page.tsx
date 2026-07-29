import type { Metadata } from "next";
import { SavedGrid } from "@/features/apply/saved-grid";

export const metadata: Metadata = {
  title: "Saved homes — Hecta",
  description: "Homes you've saved to revisit later on Hecta.",
  robots: { index: false },
};

export default function SavedPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6 md:py-8">
      <h1 className="font-heading text-2xl font-bold text-ink">Saved homes</h1>
      <div className="mt-6">
        <SavedGrid />
      </div>
    </div>
  );
}
