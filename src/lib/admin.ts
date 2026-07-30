import { cityBySlug, stateBySlug } from "@/constants/locations";
import type {
  Listing,
  VerificationStatus,
  VerificationSubmission,
} from "@/lib/types";

const NIN_VISIBLE_DIGITS = 4;
const FULLY_MASKED_TAIL = "••••";

/**
 * Masks a submission's NIN down to its last 4 digits for display — the
 * literal contract from the Task 18 brief ("never render the full NIN").
 * Works whether the stored value is already partially masked (the seed data
 * stores e.g. "***********1234") or a raw string of digits: only the
 * trailing digits ever reach the screen, everything else is discarded.
 *
 * Privacy-critical edge case: for an input with fewer than 4 digits total,
 * `.slice(-4)` would return every digit there is — i.e. the "masked" output
 * would render the entire value. Rather than ever expose more than 4
 * digits under this mask, any input that doesn't have at least 4 digits to
 * draw from renders fully masked instead.
 */
export function maskNinLast4(nin: string): string {
  const digits = nin.replace(/\D/g, "");
  const last4 =
    digits.length >= NIN_VISIBLE_DIGITS
      ? digits.slice(-NIN_VISIBLE_DIGITS)
      : FULLY_MASKED_TAIL;
  return `••• •••• ${last4}`;
}

// A "valid" mock NIN is some run of non-digit mask characters (asterisks,
// bullets, nothing at all) followed by exactly 4 trailing digits and no
// digits anywhere else — i.e. it looks like a properly masked NIN rather
// than garbage. This is a real (if lightweight) check against the stored
// value, not a hardcoded pass.
const MASKED_NIN_PATTERN = /^\D*\d{4}$/;

export function ninFormatValid(nin: string): boolean {
  return MASKED_NIN_PATTERN.test(nin);
}

/**
 * Builds the same kind of free-text address a landlord types into the
 * verification wizard's "Property address" field, from a `Listing`'s
 * structured `location` — street first, then area/city/state labels looked
 * up from `NIGERIA_LOCATIONS`. Used only to compare against
 * `VerificationSubmission.propertyAddress` (see `hasDuplicateAddress`); nowhere
 * else needs a listing's address as a single string.
 */
export function formatListingAddress(listing: Listing): string {
  const { location } = listing;
  const city = cityBySlug(location.state, location.cityLga);
  const area = city?.areas.find(
    (candidate) => candidate.slug === location.area,
  );
  const state = stateBySlug(location.state);

  return [location.street, area?.label, city?.label, state?.label]
    .filter((part): part is string => part !== undefined && part.length > 0)
    .join(", ");
}

// Loose match on purpose: the same address can be typed with different
// punctuation/casing, and a city label can carry a parenthetical aside (e.g.
// "Yaba (Lagos Mainland)") that a landlord typing their own address would
// never include. Stripping both down to bare alphanumeric tokens is what
// makes "University Road, Akoka, Yaba, Lagos" match a listing address built
// from "Yaba (Lagos Mainland)" — a real match, not a coincidence of exact
// string equality.
function normalizeAddress(value: string): string {
  return value
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * True when some existing listing's address matches `propertyAddress` —
 * computed fresh against the live `listings` list every time (never
 * hardcoded), so it reflects whatever is actually in the store. Deliberately
 * does not exclude listings owned by the same landlord as the submission:
 * an address that already appears on any listing in the system is worth the
 * reviewer's attention, whether or not it turns out to be their own earlier
 * draft.
 */
export function hasDuplicateAddress(
  propertyAddress: string,
  listings: Listing[],
): boolean {
  const target = normalizeAddress(propertyAddress);
  if (target === "") return false;
  return listings.some(
    (listing) => normalizeAddress(formatListingAddress(listing)) === target,
  );
}

const REFERENCE_HASH_MODULUS = 1_000_000;
const REFERENCE_DIGITS = 6;
const REFERENCE_HASH_MULTIPLIER = 31;

/**
 * A short, deterministic, non-secret reference number for the mock document
 * preview dialog — a simple string hash of the submission id folded into 6
 * digits, so it's stable across renders and reloads and reads like a real
 * reference rather than a fragment of the id. Never `Math.random()` (this
 * file's data must stay reproducible like the rest of the mock dataset).
 */
export function verificationReferenceNumber(
  submission: VerificationSubmission,
): string {
  let hash = 0;
  for (let i = 0; i < submission.id.length; i += 1) {
    hash =
      (hash * REFERENCE_HASH_MULTIPLIER + submission.id.charCodeAt(i)) %
      REFERENCE_HASH_MODULUS;
  }
  return `HCT-DOC-${String(hash).padStart(REFERENCE_DIGITS, "0")}`;
}

// Only `reviewVerification` ever produces these three statuses — anything
// in one of them has had an admin decision recorded against it at some
// point. Used for the admin overview's "recent decisions" list, where an
// info-requested submission is just as much a recorded decision as an
// approval or rejection.
const REVIEWED_STATUSES: ReadonlySet<VerificationStatus> = new Set([
  "approved",
  "rejected",
  "info_requested",
]);

export function isDecidedVerification(status: VerificationStatus): boolean {
  return REVIEWED_STATUSES.has(status);
}

// Terminal, in the sense the review queue means it: nothing further is
// expected to happen to the submission. `info_requested` is deliberately
// excluded — it's still an open loop waiting on the landlord's
// resubmission, so the queue treats it the same as "submitted"/
// "under_review" for ordering purposes even though `isDecidedVerification`
// (above) already counts it as a recorded decision.
const TERMINAL_STATUSES: ReadonlySet<VerificationStatus> = new Set([
  "approved",
  "rejected",
]);

/**
 * Queue order for the verification list: submissions still needing
 * attention ("submitted", "under_review", "info_requested") first,
 * terminal ones ("approved", "rejected") after — within each group, most
 * recently submitted first. Kept as a pure function (rather than inline
 * `.sort()` in the component) so the ordering rule is unit-testable on its
 * own.
 */
export function sortVerificationsForQueue(
  verifications: VerificationSubmission[],
): VerificationSubmission[] {
  return [...verifications].sort((a, b) => {
    const aActionable = !TERMINAL_STATUSES.has(a.status);
    const bActionable = !TERMINAL_STATUSES.has(b.status);
    if (aActionable !== bActionable) return aActionable ? -1 : 1;
    return (
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  });
}
