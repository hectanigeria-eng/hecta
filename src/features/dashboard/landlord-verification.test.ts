import { describe, expect, it } from "vitest";
import { pickApprovedSubmission } from "@/features/dashboard/landlord-verification";
import type { VerificationSubmission } from "@/lib/types";

function makeSubmission(
  overrides: Partial<VerificationSubmission> = {},
): VerificationSubmission {
  return {
    id: "verification-1",
    landlordId: "user-amaka",
    landlordName: "Amaka Eze",
    nin: "***********1234",
    propertyAddress: "12 Admiralty Way, Lekki Phase 1, Lagos",
    ownershipDocType: "c_of_o",
    legitimacyDoc: "none",
    status: "submitted",
    submittedAt: "2026-07-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("pickApprovedSubmission", () => {
  it("returns undefined when verified but the landlord has no submissions on file", () => {
    expect(pickApprovedSubmission(true, [])).toBeUndefined();
  });

  it("returns undefined when verified but the only submission is still 'submitted'", () => {
    const submissions = [makeSubmission({ id: "v-1", status: "submitted" })];
    expect(pickApprovedSubmission(true, submissions)).toBeUndefined();
  });

  it("returns undefined when verified but the only submission is 'info_requested'", () => {
    const submissions = [
      makeSubmission({ id: "v-1", status: "info_requested" }),
    ];
    expect(pickApprovedSubmission(true, submissions)).toBeUndefined();
  });

  it("finds an approved submission even when a later, non-approved resubmission is more recent", () => {
    // Sorted newest-first, as `LandlordVerification` sorts `mySubmissions`.
    const submissions = [
      makeSubmission({
        id: "v-2-resubmission",
        status: "info_requested",
        submittedAt: "2026-07-20T00:00:00.000Z",
      }),
      makeSubmission({
        id: "v-1-approved",
        status: "approved",
        submittedAt: "2026-07-01T00:00:00.000Z",
      }),
    ];
    const result = pickApprovedSubmission(true, submissions);
    expect(result?.id).toBe("v-1-approved");
  });

  it("returns undefined when not verified, regardless of what submissions exist", () => {
    const submissions = [makeSubmission({ status: "approved" })];
    expect(pickApprovedSubmission(false, submissions)).toBeUndefined();
  });
});
