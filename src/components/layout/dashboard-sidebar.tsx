"use client";

import { ListIcon } from "@phosphor-icons/react";
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
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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

// "/dashboard" itself only matches exactly (otherwise it would stay
// highlighted on every nested route); every other item also matches its own
// subpaths (e.g. "/dashboard/listings/123").
function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/dashboard" || href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
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
  const link = (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
        active
          ? "bg-primary-100 text-primary-900"
          : "text-muted-ink hover:bg-muted hover:text-ink",
      )}
    >
      <span aria-hidden className="shrink-0 [&_svg]:size-5">
        {item.icon}
      </span>
      <span className="flex-1">{item.label}</span>
      {item.badge !== undefined && item.badge > 0 && (
        <Badge className="rounded-full bg-secondary-500 px-2 py-0.5 text-xs text-secondary-50 normal-case tracking-normal">
          {item.badge}
        </Badge>
      )}
    </Link>
  );
  return closeOnNavigate ? <SheetClose asChild>{link}</SheetClose> : link;
}

/**
 * Generic dashboard shell: a persistent nav + persona switcher on `lg`
 * screens, collapsing to a top bar with a `Sheet` drawer below that. Shared
 * between the landlord dashboard (this task) and the admin console (Task
 * 18) — only `title` and `items` differ between the two.
 */
export function DashboardSidebar({
  title,
  items,
  children,
}: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh bg-paper lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:gap-8 lg:border-r lg:border-border lg:bg-background lg:px-5 lg:py-8">
        <span className="font-heading text-xl font-bold tracking-tight text-ink">
          {title}
        </span>
        <nav aria-label="Dashboard" className="flex flex-1 flex-col gap-1">
          {items.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isNavItemActive(pathname, item.href)}
            />
          ))}
        </nav>
        <PersonaSwitcher />
      </aside>

      <div className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon-lg"
              aria-label="Open navigation menu"
            >
              <ListIcon className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col gap-0 p-0">
            <SheetHeader>
              <SheetTitle className="normal-case tracking-tight">
                {title}
              </SheetTitle>
              <SheetDescription className="sr-only">
                Dashboard navigation
              </SheetDescription>
            </SheetHeader>
            <nav
              aria-label="Dashboard"
              className="flex flex-1 flex-col gap-1 px-4"
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
            <SheetFooter>
              <PersonaSwitcher />
            </SheetFooter>
          </SheetContent>
        </Sheet>
        <span className="font-heading text-lg font-bold tracking-tight text-ink">
          {title}
        </span>
      </div>

      <main className="min-w-0 px-4 py-6 md:px-6 md:py-8 lg:px-10 lg:py-10">
        {children}
      </main>
    </div>
  );
}
