import { HouseLineIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ListingNotFoundPage() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-3 px-4 py-24 text-center">
      <HouseLineIcon weight="duotone" className="size-12 text-muted-ink" />
      <h1 className="font-heading text-2xl font-bold text-ink">
        Listing not found
      </h1>
      <p className="text-sm text-muted-ink">
        We couldn&apos;t find a home at this address. It may have been let,
        sold, or taken down by the landlord.
      </p>
      <Button
        asChild
        className="mt-2 h-11 rounded-full px-6 text-sm font-semibold tracking-normal normal-case"
      >
        <Link href="/search">Back to search</Link>
      </Button>
    </div>
  );
}
