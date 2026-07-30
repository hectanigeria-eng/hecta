import { beforeEach, describe, expect, it } from "vitest";
import { RECONFIRM_INTERVAL_DAYS } from "@/constants/marketplace";
import {
  migratePersistedState,
  STORE_VERSION,
  useHectaStore,
} from "@/lib/store";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

beforeEach(() => {
  useHectaStore.getState().resetDemo();
});

describe("reviewVerification", () => {
  it("sets landlordVerified on the owning landlord, not the active (reviewing) user", () => {
    useHectaStore.getState().switchPersona("user-admin");

    useHectaStore.getState().reviewVerification("verification-2", "approved");

    const state = useHectaStore.getState();
    const owner = state.users.find((u) => u.id === "user-emeka");
    const reviewer = state.users.find((u) => u.id === "user-admin");
    expect(owner?.landlordVerified).toBe(true);
    expect(reviewer?.landlordVerified).toBe(false);
    expect(
      state.verifications.find((v) => v.id === "verification-2")?.status,
    ).toBe("approved");
  });

  it("does not touch landlordVerified for a non-approved status", () => {
    // ll-seed-3 is seeded with landlordVerified: true, which made the
    // original version of this test a tautology — it asserted `true` and
    // would have passed even if `reviewVerification` wrongly flipped the
    // flag on a rejection. Forcing it to `false` first means the assertion
    // below only passes if the action genuinely leaves it untouched.
    useHectaStore.setState((state) => ({
      users: state.users.map((user) =>
        user.id === "ll-seed-3" ? { ...user, landlordVerified: false } : user,
      ),
    }));

    useHectaStore
      .getState()
      .reviewVerification("verification-3", "rejected", "Docs don't match.");

    const state = useHectaStore.getState();
    const owner = state.users.find((u) => u.id === "ll-seed-3");
    expect(owner?.landlordVerified).toBe(false);
    expect(
      state.verifications.find((v) => v.id === "verification-3")?.reviewNote,
    ).toBe("Docs don't match.");
  });
});

describe("reviewListing", () => {
  it("sets a pending listing to active on approve", () => {
    useHectaStore.getState().reviewListing("listing-31", true);
    const listing = useHectaStore
      .getState()
      .listings.find((l) => l.id === "listing-31");
    expect(listing?.status).toBe("active");
  });

  it("sets a pending listing to rejected on decline", () => {
    useHectaStore.getState().reviewListing("listing-31", false, "Overpriced.");
    const listing = useHectaStore
      .getState()
      .listings.find((l) => l.id === "listing-31");
    expect(listing?.status).toBe("rejected");
  });

  it("persists the reason as reviewNote on rejection", () => {
    useHectaStore
      .getState()
      .reviewListing(
        "listing-31",
        false,
        "Price is far above comparable Yaba flats — please justify or lower it.",
      );
    const listing = useHectaStore
      .getState()
      .listings.find((l) => l.id === "listing-31");
    expect(listing?.reviewNote).toBe(
      "Price is far above comparable Yaba flats — please justify or lower it.",
    );
  });

  it("clears any prior reviewNote on approval", () => {
    useHectaStore.getState().reviewListing("listing-31", false, "Overpriced.");
    useHectaStore.getState().reviewListing("listing-31", true);
    const listing = useHectaStore
      .getState()
      .listings.find((l) => l.id === "listing-31");
    expect(listing?.status).toBe("active");
    expect(listing?.reviewNote).toBeUndefined();
  });
});

describe("submitReport", () => {
  it("ignores a duplicate report from the same reporter on the same listing", () => {
    // Seed already has report-4: user-tunde reported listing-3.
    const before = useHectaStore.getState().reports.length;
    useHectaStore.getState().switchPersona("user-tunde");

    useHectaStore
      .getState()
      .submitReport(
        "listing-3",
        "agent_posing",
        "Second attempt, same reporter.",
      );

    expect(useHectaStore.getState().reports.length).toBe(before);
  });

  it("auto-suspends a listing once a 3rd distinct reporter files an open report", () => {
    const listingId = "listing-1"; // active, unreported in seed
    const reporters = ["user-tunde", "user-chidi", "user-fatima"];

    reporters.forEach((reporterId, index) => {
      useHectaStore.getState().switchPersona(reporterId);
      useHectaStore
        .getState()
        .submitReport(listingId, "scam_listing", `Report #${index + 1}`);
    });

    const state = useHectaStore.getState();
    const listing = state.listings.find((l) => l.id === listingId);
    expect(listing?.status).toBe("suspended");
    expect(
      state.reports.filter((r) => r.targetListingId === listingId).length,
    ).toBe(3);
  });

  it("does not suspend a listing with fewer than the auto-suspend threshold", () => {
    useHectaStore.getState().switchPersona("user-chidi");
    useHectaStore
      .getState()
      .submitReport("listing-2", "spam_user", "Only one report so far.");

    const listing = useHectaStore
      .getState()
      .listings.find((l) => l.id === "listing-2");
    expect(listing?.status).toBe("active");
  });
});

describe("markApplicationStatus", () => {
  it('creates a message thread when status becomes "accepted" and none exists yet', () => {
    // app-2 (Fatima, listing-1) has no thread in the seed.
    const threadsBefore = useHectaStore.getState().threads.length;

    useHectaStore.getState().markApplicationStatus("app-2", "accepted");

    const state = useHectaStore.getState();
    expect(state.threads.length).toBe(threadsBefore + 1);
    const application = state.applications.find((a) => a.id === "app-2");
    expect(application?.status).toBe("accepted");
    const thread = state.threads.find((t) => t.applicationId === "app-2");
    expect(thread).toBeDefined();
    expect(thread?.listingId).toBe("listing-1");
    expect(thread?.participantIds).toEqual(["user-fatima", "user-amaka"]);
  });

  it('creates a message thread when status becomes "info_requested" and none exists yet', () => {
    const threadsBefore = useHectaStore.getState().threads.length;

    useHectaStore.getState().markApplicationStatus("app-4", "info_requested");

    const state = useHectaStore.getState();
    expect(state.threads.length).toBe(threadsBefore + 1);
    const thread = state.threads.find((t) => t.applicationId === "app-4");
    expect(thread?.participantIds).toEqual(["user-fatima", "user-amaka"]);
  });

  it("does not create a duplicate thread if one already exists for the application", () => {
    // app-1 already has thread-1 in the seed.
    const threadsBefore = useHectaStore.getState().threads.length;

    useHectaStore.getState().markApplicationStatus("app-1", "accepted");

    const state = useHectaStore.getState();
    expect(state.threads.length).toBe(threadsBefore);
    expect(
      state.threads.filter((t) => t.applicationId === "app-1").length,
    ).toBe(1);
  });

  it('does not create a thread for statuses other than "accepted"/"info_requested"', () => {
    const threadsBefore = useHectaStore.getState().threads.length;

    useHectaStore.getState().markApplicationStatus("app-2", "declined");

    expect(useHectaStore.getState().threads.length).toBe(threadsBefore);
  });
});

describe("submitApplication", () => {
  it("attaches the active user's intentProfile and stamps the current time", () => {
    useHectaStore.getState().switchPersona("user-tunde");
    const tunde = useHectaStore
      .getState()
      .users.find((u) => u.id === "user-tunde");
    if (tunde?.intentProfile === undefined) {
      throw new Error(
        "Fixture assumption failed: user-tunde has no intentProfile.",
      );
    }

    const before = Date.now();
    useHectaStore.getState().submitApplication("listing-2", "I'm interested.");
    const after = Date.now();

    const state = useHectaStore.getState();
    const application = state.applications.find(
      (a) => a.applicantId === "user-tunde" && a.listingId === "listing-2",
    );
    expect(application).toBeDefined();
    expect(application?.message).toBe("I'm interested.");
    expect(application?.status).toBe("submitted");
    expect(application?.intentProfile).toEqual(tunde.intentProfile);
    const createdAtMs = new Date(application?.createdAt ?? "").getTime();
    expect(createdAtMs).toBeGreaterThanOrEqual(before);
    expect(createdAtMs).toBeLessThanOrEqual(after);
  });

  it("throws rather than silently succeeding when the active user has no intentProfile", () => {
    useHectaStore.getState().switchPersona("user-admin"); // seeded with no intentProfile

    expect(() =>
      useHectaStore.getState().submitApplication("listing-2", "Hello"),
    ).toThrow(/intentProfile/);

    // No application should have been added.
    expect(
      useHectaStore
        .getState()
        .applications.some((a) => a.applicantId === "user-admin"),
    ).toBe(false);
  });
});

describe("confirmAvailability", () => {
  it("bumps lastConfirmedAvailableAt to now and recomputes reconfirmDueAt", () => {
    const before = Date.now();
    useHectaStore.getState().confirmAvailability("listing-1");
    const after = Date.now();

    const listing = useHectaStore
      .getState()
      .listings.find((l) => l.id === "listing-1");
    expect(listing).toBeDefined();
    const confirmedMs = new Date(
      listing?.lastConfirmedAvailableAt ?? "",
    ).getTime();
    expect(confirmedMs).toBeGreaterThanOrEqual(before);
    expect(confirmedMs).toBeLessThanOrEqual(after);

    const dueMs = new Date(listing?.reconfirmDueAt ?? "").getTime();
    expect(dueMs - confirmedMs).toBe(RECONFIRM_INTERVAL_DAYS * MS_PER_DAY);
  });
});

describe("migratePersistedState", () => {
  it("passes the persisted payload through unchanged when the version matches", () => {
    const payload = { activeUserId: "user-tunde", listings: [] };
    expect(migratePersistedState(payload, STORE_VERSION)).toBe(payload);
  });

  it("discards an older-versioned payload and falls back to fresh seed data", () => {
    const stalePayload = {
      activeUserId: "user-tunde",
      listings: [], // a stale browser missing seeded listings entirely
    };

    const migrated = migratePersistedState(stalePayload, STORE_VERSION - 1);

    expect(migrated).not.toBe(stalePayload);
    // Narrowing `unknown` to check shape; safe because `seedData()` (the
    // only fallback `migratePersistedState` can return here) always has
    // these fields.
    const seeded = migrated as { listings: unknown[]; activeUserId: string };
    expect(seeded.listings.length).toBeGreaterThan(0);
    expect(seeded.activeUserId).toBe("anonymous");
  });

  it("also discards a newer-versioned payload (e.g. a rollback scenario)", () => {
    const fromTheFuture = { activeUserId: "user-amaka", listings: [] };

    const migrated = migratePersistedState(fromTheFuture, STORE_VERSION + 1);

    // Same shape guarantee as above — fallback is always `seedData()`.
    const seeded = migrated as { listings: unknown[]; activeUserId: string };
    expect(seeded.listings.length).toBeGreaterThan(0);
    expect(seeded.activeUserId).toBe("anonymous");
  });
});

describe("resetDemo", () => {
  it("restores the seed data and returns the active persona to anonymous", () => {
    useHectaStore.getState().switchPersona("user-amaka");
    useHectaStore.getState().reviewListing("listing-31", true);
    useHectaStore.getState().switchPersona("user-tunde");
    useHectaStore
      .getState()
      .submitReport("listing-2", "spam_user", "Testing reset.");

    useHectaStore.getState().resetDemo();

    const state = useHectaStore.getState();
    expect(state.activeUserId).toBe("anonymous");
    expect(state.listings.find((l) => l.id === "listing-31")?.status).toBe(
      "pending_review",
    );
    expect(state.reports.some((r) => r.reason === "Testing reset.")).toBe(
      false,
    );
  });
});
