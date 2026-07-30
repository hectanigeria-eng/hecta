"use client";

import {
  ChatCircleIcon,
  HeartIcon,
  PaperPlaneTiltIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MobileNavItem } from "@/features/session/persona-switcher";
import { PersonaSwitcher } from "@/features/session/persona-switcher";
import { buildSearchUrl, parseSearchParams } from "@/lib/search-params";
import type { Intent } from "@/lib/types";

const NAV_ITEMS: MobileNavItem[] = [
  { label: "Saved", href: "/saved", icon: HeartIcon },
  { label: "Applications", href: "/applications", icon: PaperPlaneTiltIcon },
  { label: "Messages", href: "/messages", icon: ChatCircleIcon },
];

function IntentToggle() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = parseSearchParams(Object.fromEntries(searchParams.entries()));

  function handleIntentChange(value: string) {
    // TabsTrigger values below are restricted to "rent" | "buy", so this
    // string is always a valid Intent.
    const intent = value as Intent;
    router.push(buildSearchUrl({ intent, page: 1 }, query));
  }

  return (
    <Tabs value={query.intent} onValueChange={handleIntentChange}>
      <TabsList variant="line" aria-label="Rent or buy">
        <TabsTrigger value="rent">Rent</TabsTrigger>
        <TabsTrigger value="buy">Buy</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

export function PlatformHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 md:gap-6 md:px-6">
        <Link href="/search" className="flex items-center">
          <Image
            src="/assets/logo/hecta-logo-6.svg"
            alt="Hecta"
            width={79}
            height={30}
            priority
          />
        </Link>

        <nav aria-label="Search intent" className="flex flex-1 justify-center">
          <Suspense fallback={<Skeleton className="h-10 w-40 rounded-lg" />}>
            <IntentToggle />
          </Suspense>
        </nav>

        <div className="flex items-center gap-1">
          <Button
            asChild
            variant="ghost"
            size="icon-lg"
            className="hidden md:inline-flex"
          >
            <Link href="/saved" aria-label="Saved listings">
              <HeartIcon className="size-5" />
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="icon-lg"
            className="hidden md:inline-flex"
          >
            <Link href="/applications" aria-label="Applications">
              <PaperPlaneTiltIcon className="size-5" />
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="icon-lg"
            className="hidden md:inline-flex"
          >
            <Link href="/messages" aria-label="Messages">
              <ChatCircleIcon className="size-5" />
            </Link>
          </Button>
          <PersonaSwitcher mobileNavItems={NAV_ITEMS} />
        </div>
      </div>
    </header>
  );
}
