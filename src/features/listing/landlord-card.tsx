"use client";

import {
  FlagIcon,
  SealCheckIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDate } from "@/lib/format";

const MAX_INITIALS = 2;

function initialsOf(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, MAX_INITIALS)
    .map((part) => part[0].toUpperCase())
    .join("");
}

interface LandlordCardProps {
  landlordName: string;
  landlordVerified: boolean;
  verifiedProperty: boolean;
  /** ISO date of the most recent verification, when one is on record. */
  lastVerifiedAt?: string;
  onReport: () => void;
}

export function LandlordCard({
  landlordName,
  landlordVerified,
  verifiedProperty,
  lastVerifiedAt,
  onReport,
}: LandlordCardProps) {
  return (
    <Card size="sm" className="gap-4 rounded-3xl ring-1 ring-border">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Avatar size="lg" className="size-12">
            <AvatarFallback className="bg-primary-100 text-sm font-semibold text-primary-800">
              {initialsOf(landlordName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-xs text-muted-ink">Listed by</p>
            <p className="truncate font-heading text-base font-semibold text-ink">
              {landlordName}
            </p>
          </div>
        </div>

        <TooltipProvider>
          <ul className="flex list-none flex-wrap gap-2 p-0">
            {landlordVerified && (
              <li>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      tabIndex={0}
                      className="cursor-help rounded-full bg-primary-100 px-3 py-1.5 text-xs tracking-normal text-primary-800 normal-case"
                    >
                      <ShieldCheckIcon weight="fill" />
                      Verified landlord
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    Identity and ownership documents confirmed by Hecta
                  </TooltipContent>
                </Tooltip>
              </li>
            )}
            {verifiedProperty && (
              <li>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      tabIndex={0}
                      className="cursor-help rounded-full bg-card px-3 py-1.5 text-xs tracking-normal text-primary-800 normal-case ring-1 ring-primary-300"
                    >
                      <SealCheckIcon weight="fill" />
                      Verified property
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    This specific address verified against title documents
                  </TooltipContent>
                </Tooltip>
              </li>
            )}
          </ul>
        </TooltipProvider>

        {lastVerifiedAt !== undefined && (
          <p className="text-xs text-muted-ink">
            Last verified {formatDate(lastVerifiedAt)}
          </p>
        )}
      </CardContent>

      <CardContent>
        <Separator className="mb-3" />
        <Button
          type="button"
          variant="ghost"
          onClick={onReport}
          className="h-11 w-full justify-start gap-2 rounded-full px-3 text-xs font-medium tracking-normal text-muted-ink normal-case hover:text-ink"
        >
          <FlagIcon weight="regular" className="size-4" />
          Report this listing
        </Button>
      </CardContent>
    </Card>
  );
}
