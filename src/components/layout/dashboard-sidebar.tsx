"use client";

import { ListIcon, XIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PersonaSwitcher } from "@/features/session/persona-switcher";
import { cn } from "@/lib/utils";

export interface DashboardNavItem {
  href: string;
  label: string;
  icon: ReactNode;
  badge?: number;
}

interface DashboardSidebarProps {
  /** The wordmark shown at the top of the sidebar, e.g. "Hecta · Landlord". */
  title: string;
  items: DashboardNavItem[];
  children: ReactNode;
}

/** Shared by both tiers so a rail icon and its nav label light up together. */
const ACTIVE_CHIP = "bg-deep text-secondary-400 ring-1 ring-paper/10";
/** Focus ring that stays visible against the deep-green chrome. */
const DARK_FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-deep-2";

// "/dashboard" itself only matches exactly (otherwise it would stay
// highlighted on every nested route); every other item also matches its own
// subpaths (e.g. "/dashboard/listings/123").
function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/dashboard" || href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** The count to render, or `undefined` when there is nothing to show. */
function badgeCount(item: DashboardNavItem): number | undefined {
  return item.badge !== undefined && item.badge > 0 ? item.badge : undefined;
}

/** "/dashboard/listings/123" → { href: "/dashboard", label: "Dashboard" }. */
function sectionRoot(pathname: string): { href: string; label: string } {
  const segment = pathname.split("/").at(1) ?? "";
  return {
    href: `/${segment}`,
    label: `${segment.charAt(0).toUpperCase()}${segment.slice(1)}`,
  };
}

function NavBadge({ count, className }: { count: number; className?: string }) {
  return (
    <Badge
      className={cn(
        "rounded-full bg-secondary-500 px-2 py-0.5 text-xs text-secondary-950 normal-case tracking-normal",
        className,
      )}
    >
      {count}
    </Badge>
  );
}

/** Icon-only link in the far-left rail, labelled by tooltip + `aria-label`. */
function RailLink({
  item,
  active,
}: {
  item: DashboardNavItem;
  active: boolean;
}) {
  const count = badgeCount(item);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={item.href}
          aria-label={item.label}
          aria-current={active ? "page" : undefined}
          className={cn(
            "relative flex size-11 items-center justify-center rounded-xl transition-colors motion-reduce:transition-none",
            DARK_FOCUS_RING,
            active
              ? ACTIVE_CHIP
              : "text-paper/70 hover:bg-deep hover:text-paper",
          )}
        >
          <span aria-hidden className="[&_svg]:size-5">
            {item.icon}
          </span>
          {count !== undefined && (
            <NavBadge
              count={count}
              className="absolute -top-0.5 -right-0.5 px-1.5 py-0"
            />
          )}
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}

function NavLink({
  item,
  active,
  closeOnNavigate = false,
}: {
  item: DashboardNavItem;
  active: boolean;
  /** Wrap the link in `SheetClose` so tapping it also dismisses the mobile drawer. */
  closeOnNavigate?: boolean;
}) {
  const count = badgeCount(item);
  const link = (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors motion-reduce:transition-none",
        DARK_FOCUS_RING,
        active ? ACTIVE_CHIP : "text-paper/70 hover:bg-deep hover:text-paper",
      )}
    >
      <span aria-hidden className="shrink-0 [&_svg]:size-5">
        {item.icon}
      </span>
      <span className="flex-1">{item.label}</span>
      {count !== undefined && <NavBadge count={count} />}
    </Link>
  );
  return closeOnNavigate ? <SheetClose asChild>{link}</SheetClose> : link;
}

/**
 * Generic dashboard shell: a two-tier dark chrome — an icon rail beside a
 * labelled nav column — with the page rendered as a light `bg-paper` panel
 * floating inset on top of it. Collapses to a dark top bar with a `Sheet`
 * drawer below `lg`. Shared between the landlord dashboard and the admin
 * console — only `title` and `items` differ between the two.
 */
export function DashboardSidebar({
  title,
  items,
  children,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const root = sectionRoot(pathname);
  const activeItem = items.find((item) => isNavItemActive(pathname, item.href));

  return (
    <div className="flex min-h-dvh flex-col bg-deep-2 lg:grid lg:grid-cols-[5rem_17rem_minmax(0,1fr)]">
      <TooltipProvider>
        <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:items-center lg:gap-8 lg:py-6">
          <Link
            href={root.href}
            aria-label={`${title} home`}
            className={cn(
              "flex size-11 items-center justify-center rounded-2xl bg-deep font-heading text-lg font-bold text-secondary-400",
              DARK_FOCUS_RING,
            )}
          >
            <span aria-hidden>H</span>
          </Link>
          <nav
            aria-label={`${root.label} shortcuts`}
            className="flex flex-1 flex-col items-center gap-2"
          >
            {items.map((item) => (
              <RailLink
                key={item.href}
                item={item}
                active={isNavItemActive(pathname, item.href)}
              />
            ))}
          </nav>
          <PersonaSwitcher />
        </aside>
      </TooltipProvider>

      <div className="hidden lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:gap-8 lg:px-3 lg:py-6">
        <span className="flex h-11 items-center truncate px-3 font-heading text-2xl font-bold tracking-tight text-paper">
          {title}
        </span>
        <nav
          aria-label={root.label}
          className="flex flex-1 flex-col gap-2 overflow-y-auto"
        >
          {items.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isNavItemActive(pathname, item.href)}
            />
          ))}
        </nav>
      </div>

      <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 bg-deep-2 px-3 lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon-lg"
              aria-label="Open navigation menu"
              className={cn(
                "text-paper hover:bg-deep hover:text-paper",
                DARK_FOCUS_RING,
              )}
            >
              <ListIcon className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            showCloseButton={false}
            className="flex flex-col gap-0 border-r-0 bg-deep-2 p-0 text-paper"
          >
            <SheetHeader className="flex-row items-center justify-between gap-2 p-4">
              <SheetTitle className="min-w-0 truncate text-paper normal-case tracking-tight">
                {title}
              </SheetTitle>
              <SheetDescription className="sr-only">
                Dashboard navigation
              </SheetDescription>
              <SheetClose asChild>
                <Button
                  variant="ghost"
                  size="icon-lg"
                  aria-label="Close navigation menu"
                  className={cn(
                    "shrink-0 text-paper hover:bg-deep hover:text-paper",
                    DARK_FOCUS_RING,
                  )}
                >
                  <XIcon className="size-5" />
                </Button>
              </SheetClose>
            </SheetHeader>
            <nav
              aria-label={root.label}
              className="flex flex-1 flex-col gap-2 px-3 pb-6"
            >
              {items.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  active={isNavItemActive(pathname, item.href)}
                  closeOnNavigate
                />
              ))}
            </nav>
          </SheetContent>
        </Sheet>
        <span className="min-w-0 flex-1 truncate font-heading text-lg font-bold tracking-tight text-paper">
          {title}
        </span>
        <PersonaSwitcher />
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-2 lg:p-3">
        <div className="flex flex-1 flex-col rounded-3xl bg-paper lg:rounded-4xl">
          <nav
            aria-label="Breadcrumb"
            className="px-4 pt-4 md:px-6 md:pt-5 lg:px-10 lg:pt-8"
          >
            <ol className="flex flex-wrap items-center gap-2 text-sm">
              <li>
                <Link
                  href={root.href}
                  className="rounded-sm text-muted-ink transition-colors hover:text-ink motion-reduce:transition-none"
                >
                  {root.label}
                </Link>
              </li>
              {activeItem !== undefined && (
                <>
                  <li aria-hidden className="text-paper-3">
                    /
                  </li>
                  <li aria-current="page" className="font-medium text-ink">
                    {activeItem.label}
                  </li>
                </>
              )}
            </ol>
          </nav>

          <main className="min-w-0 flex-1 px-4 pt-3 pb-5 md:px-6 md:pt-4 md:pb-8 lg:px-10 lg:pt-8 lg:pb-10">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
