import {
  ArrowCounterClockwiseIcon,
  SealCheckIcon,
} from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { formatNaira, pricePeriodLabel } from "@/lib/format";
import { costBreakdown } from "@/lib/marketplace";
import type { Listing } from "@/lib/types";
import { cn } from "@/lib/utils";

function basePriceLabel(listing: Listing): string {
  if (listing.intent === "buy") return "Asking price";
  return listing.pricePeriod === "per_month"
    ? "Rent (monthly)"
    : "Rent (yearly)";
}

interface CostBreakdownCardProps {
  listing: Listing;
  /** The action bar — rendered inside the card, under the total. */
  children?: ReactNode;
}

/**
 * The page's centrepiece. Nigerian listings routinely advertise a headline
 * rent and only reveal agency, legal and caution charges at signing, so the
 * true move-in total is given more visual weight than the headline price and
 * every charge is explicitly marked refundable or not.
 */
export function CostBreakdownCard({
  listing,
  children,
}: CostBreakdownCardProps) {
  const { price, refundable, total } = costBreakdown(listing);

  return (
    <Card size="sm" className="gap-5 rounded-3xl ring-1 ring-border">
      <CardContent className="flex flex-col gap-1">
        <h2
          id="cost-breakdown-heading"
          className="text-xs font-semibold tracking-wide text-muted-ink uppercase"
        >
          What it really costs
        </h2>
        <p className="font-heading text-3xl leading-tight font-bold text-ink">
          {formatNaira(price)}
          <span className="text-base font-medium text-muted-ink">
            {pricePeriodLabel(listing.pricePeriod)}
          </span>
        </p>
      </CardContent>

      <CardContent className="px-0">
        <Table>
          <TableCaption className="sr-only">
            Every upfront charge for this home
          </TableCaption>
          <TableBody>
            <TableRow className="border-border">
              <TableCell className="py-2.5 pl-5 font-medium whitespace-normal text-ink">
                {basePriceLabel(listing)}
              </TableCell>
              <TableCell className="py-2.5 pr-5 text-right align-top font-medium text-ink tabular-nums">
                {formatNaira(price)}
              </TableCell>
            </TableRow>

            {listing.otherCharges.map((charge, index) => (
              <TableRow
                key={`${charge.label}-${index}`}
                className="border-border"
              >
                {/* Label and badge share one cell so they stack instead of
                    forcing the card wider than a 375px viewport. */}
                <TableCell className="py-2.5 pl-5 whitespace-normal">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-ink">{charge.label}</span>
                    <Badge
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs tracking-normal normal-case",
                        charge.refundable
                          ? "bg-primary-100 text-primary-800"
                          : "bg-paper-2 text-muted-ink ring-1 ring-border",
                      )}
                    >
                      {charge.refundable ? "Refundable" : "Non-refundable"}
                    </Badge>
                  </span>
                </TableCell>
                <TableCell className="py-2.5 pr-5 text-right align-top text-ink tabular-nums">
                  {formatNaira(charge.amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <CardContent>
        <Separator className="mb-4" />
        <div className="rounded-2xl bg-primary-50 px-4 py-4">
          <p className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-semibold text-primary-900">
              Total move-in cost
            </span>
            <span className="font-heading text-2xl font-bold text-primary-900 tabular-nums">
              {formatNaira(total)}
            </span>
          </p>
          {refundable > 0 && (
            <p className="mt-2 flex items-start gap-1.5 text-xs text-primary-800">
              <ArrowCounterClockwiseIcon
                weight="bold"
                aria-hidden
                className="mt-0.5 size-3.5 shrink-0"
              />
              <span>
                {formatNaira(refundable)} of this is refundable when you move
                out.
              </span>
            </p>
          )}
        </div>
        <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-ink">
          <SealCheckIcon
            weight="fill"
            aria-hidden
            className="mt-0.5 size-3.5 shrink-0 text-primary-600"
          />
          <span>Every cost, upfront. No surprises on inspection day.</span>
        </p>
      </CardContent>

      {children !== undefined && <CardContent>{children}</CardContent>}
    </Card>
  );
}
