import type { Metadata } from "next";
import { IdentityWizard } from "@/features/verification/identity-wizard";
import { parseNextPath } from "@/lib/safe-redirect";

export const metadata: Metadata = {
  title: "Verify your identity — Hecta",
  description:
    "Verify your identity in under a minute to save homes, apply, and message landlords on Hecta.",
  robots: { index: false },
};

interface VerifyPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

// A transactional step in the save/apply/contact flow, always reached via a
// `next` redirect target — never a page worth indexing or landing on cold.
export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const params = await searchParams;
  const nextPath = parseNextPath(firstValue(params.next));

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-10 sm:py-14">
      <IdentityWizard nextPath={nextPath} />
    </div>
  );
}
