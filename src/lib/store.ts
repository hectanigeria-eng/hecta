import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";
import { RECONFIRM_INTERVAL_DAYS } from "@/constants/marketplace";
import { shouldAutoSuspend } from "@/lib/marketplace";
import {
  MOCK_APPLICATIONS,
  MOCK_LISTINGS,
  MOCK_MESSAGES,
  MOCK_REPORTS,
  MOCK_THREADS,
  MOCK_USERS,
  MOCK_VERIFICATIONS,
} from "@/lib/mock";
import type {
  Application,
  ApplicationStatus,
  ChatMessage,
  IntentProfile,
  Listing,
  ListingStatus,
  MessageThread,
  Report,
  ReportCategory,
  ReportStatus,
  User,
  VerificationStatus,
  VerificationSubmission,
} from "@/lib/types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
// Bumped whenever the seed data's shape changes in a way that would leave
// older persisted browsers with stale/incomplete state (missing fields,
// missing rows). Bump this again the next time seed data changes shape.
// Exported so `migratePersistedState`'s pass-through path is testable.
export const STORE_VERSION = 2;
const ANONYMOUS_USER_ID = "anonymous";

export interface HectaState {
  activeUserId: string; // "anonymous" default
  users: User[];
  listings: Listing[];
  savedByUser: Record<string, string[]>; // userId -> listingIds
  applications: Application[];
  threads: MessageThread[];
  messages: ChatMessage[];
  reports: Report[];
  verifications: VerificationSubmission[];
  // actions
  switchPersona: (userId: string) => void;
  completeIdentityVerification: () => void; // marks active user identityVerified
  setIntentProfile: (profile: IntentProfile) => void;
  toggleSaved: (listingId: string) => void;
  submitApplication: (listingId: string, message: string) => void; // stamps now, attaches profile
  markApplicationStatus: (
    applicationId: string,
    status: ApplicationStatus,
  ) => void; // creates thread on "accepted"/"info_requested" if absent
  sendMessage: (threadId: string, body: string) => void;
  ensureThreadForApplication: (applicationId: string) => string; // returns threadId
  submitReport: (
    listingId: string,
    category: ReportCategory,
    reason: string,
  ) => void; // applies shouldAutoSuspend
  createListing: (
    listing: Omit<
      Listing,
      | "id"
      | "createdAt"
      | "lastConfirmedAvailableAt"
      | "reconfirmDueAt"
      | "status"
      | "verifiedProperty"
    >,
  ) => string; // status "pending_review"
  setListingStatus: (listingId: string, status: ListingStatus) => void;
  confirmAvailability: (listingId: string) => void; // bumps freshness + reconfirmDueAt
  submitVerification: (
    v: Omit<VerificationSubmission, "id" | "status" | "submittedAt">,
  ) => void;
  reviewVerification: (
    id: string,
    status: VerificationStatus,
    note?: string,
  ) => void; // "approved" sets landlordVerified on owner
  reviewListing: (listingId: string, approve: boolean, note?: string) => void; // active | rejected
  resolveReport: (reportId: string, status: ReportStatus) => void;
  resetDemo: () => void; // restore seed
}

// Hydration bookkeeping is intentionally kept out of the public HectaState
// contract (later tasks type against HectaState) but lives on the same
// store instance so `useHydrated()` can read it directly.
interface HydrationSlice {
  _hasHydrated: boolean;
  setHasHydrated: (hydrated: boolean) => void;
}

type Store = HectaState & HydrationSlice;

interface SeedData {
  activeUserId: string;
  users: User[];
  listings: Listing[];
  savedByUser: Record<string, string[]>;
  applications: Application[];
  threads: MessageThread[];
  messages: ChatMessage[];
  reports: Report[];
  verifications: VerificationSubmission[];
}

function seedData(): SeedData {
  return {
    activeUserId: ANONYMOUS_USER_ID,
    users: MOCK_USERS.map((user) => ({ ...user })),
    listings: MOCK_LISTINGS.map((listing) => ({ ...listing })),
    savedByUser: {},
    applications: MOCK_APPLICATIONS.map((application) => ({ ...application })),
    threads: MOCK_THREADS.map((thread) => ({ ...thread })),
    messages: MOCK_MESSAGES.map((message) => ({ ...message })),
    reports: MOCK_REPORTS.map((report) => ({ ...report })),
    verifications: MOCK_VERIFICATIONS.map((verification) => ({
      ...verification,
    })),
  };
}

/**
 * Decides what to do with a persisted payload found in `localStorage` at
 * store-hydration time. Exported (and kept side-effect free) so it can be
 * unit-tested without touching `localStorage` or React.
 *
 * Seed data has changed shape repeatedly across this build — old persisted
 * state can be missing rows/fields that later features rely on. Rather than
 * try to patch old shapes forward (and risk silently rendering incomplete
 * data), any version other than the current one is discarded outright and
 * replaced with the current seed. A version match is assumed to already be
 * shape-compatible, so the persisted payload passes through unchanged.
 */
export function migratePersistedState(
  persistedState: unknown,
  version: number,
): unknown {
  if (version === STORE_VERSION) return persistedState;
  return seedData();
}

// A storage that never touches `localStorage` when there is no `window`
// (Next.js server render / vitest's default "node" environment), so
// importing this module never throws outside the browser.
const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

function browserStorage(): StateStorage {
  return typeof window === "undefined" ? noopStorage : window.localStorage;
}

export const useHectaStore = create<Store>()(
  persist(
    (set, get) => ({
      ...seedData(),
      _hasHydrated: false,
      setHasHydrated: (hydrated) => set({ _hasHydrated: hydrated }),

      switchPersona: (userId) => set({ activeUserId: userId }),

      completeIdentityVerification: () =>
        set((state) => ({
          users: state.users.map((user) =>
            user.id === state.activeUserId
              ? { ...user, identityVerified: true }
              : user,
          ),
        })),

      setIntentProfile: (profile) =>
        set((state) => ({
          users: state.users.map((user) =>
            user.id === state.activeUserId
              ? { ...user, intentProfile: profile }
              : user,
          ),
        })),

      toggleSaved: (listingId) =>
        set((state) => {
          const current = state.savedByUser[state.activeUserId] ?? [];
          const next = current.includes(listingId)
            ? current.filter((id) => id !== listingId)
            : [...current, listingId];
          return {
            savedByUser: { ...state.savedByUser, [state.activeUserId]: next },
          };
        }),

      submitApplication: (listingId, message) => {
        const state = get();
        const activeUser = state.users.find(
          (user) => user.id === state.activeUserId,
        );
        if (activeUser?.intentProfile === undefined) {
          // The calling UI is expected to have already collected an
          // IntentProfile (via setIntentProfile) before an application can be
          // submitted. Rather than silently fabricating a profile or
          // dropping the application on the floor, fail loudly so the bug is
          // caught where the flow was skipped.
          throw new Error(
            "submitApplication: active user has no intentProfile set — call setIntentProfile before applying.",
          );
        }
        const application: Application = {
          id: crypto.randomUUID(),
          listingId,
          applicantId: state.activeUserId,
          message,
          intentProfile: activeUser.intentProfile,
          status: "submitted",
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ applications: [...s.applications, application] }));
      },

      markApplicationStatus: (applicationId, status) => {
        set((state) => ({
          applications: state.applications.map((application) =>
            application.id === applicationId
              ? { ...application, status }
              : application,
          ),
        }));
        if (status === "accepted" || status === "info_requested") {
          get().ensureThreadForApplication(applicationId);
        }
      },

      sendMessage: (threadId, body) =>
        set((state) => ({
          messages: [
            ...state.messages,
            {
              id: crypto.randomUUID(),
              threadId,
              senderId: state.activeUserId,
              body,
              sentAt: new Date().toISOString(),
            },
          ],
        })),

      ensureThreadForApplication: (applicationId) => {
        const state = get();
        const existing = state.threads.find(
          (thread) => thread.applicationId === applicationId,
        );
        if (existing !== undefined) return existing.id;

        const application = state.applications.find(
          (a) => a.id === applicationId,
        );
        if (application === undefined) {
          throw new Error(
            `ensureThreadForApplication: no application found with id "${applicationId}".`,
          );
        }
        const listing = state.listings.find(
          (l) => l.id === application.listingId,
        );
        if (listing === undefined) {
          throw new Error(
            `ensureThreadForApplication: no listing found with id "${application.listingId}".`,
          );
        }
        const thread: MessageThread = {
          id: crypto.randomUUID(),
          applicationId,
          listingId: listing.id,
          participantIds: [application.applicantId, listing.landlordId],
        };
        set((s) => ({ threads: [...s.threads, thread] }));
        return thread.id;
      },

      submitReport: (listingId, category, reason) => {
        const state = get();
        const isDuplicate = state.reports.some(
          (report) =>
            report.targetListingId === listingId &&
            report.reporterId === state.activeUserId,
        );
        if (isDuplicate) return;

        const report: Report = {
          id: crypto.randomUUID(),
          targetListingId: listingId,
          reporterId: state.activeUserId,
          category,
          reason,
          status: "open",
          createdAt: new Date().toISOString(),
        };
        const nextReports = [...state.reports, report];
        const suspend = shouldAutoSuspend(nextReports, listingId);
        set({
          reports: nextReports,
          listings: suspend
            ? state.listings.map((listing) =>
                listing.id === listingId
                  ? { ...listing, status: "suspended" as const }
                  : listing,
              )
            : state.listings,
        });
      },

      createListing: (listing) => {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const created: Listing = {
          ...listing,
          id,
          status: "pending_review",
          verifiedProperty: false,
          createdAt: now,
          lastConfirmedAvailableAt: now,
          reconfirmDueAt: new Date(
            Date.now() + RECONFIRM_INTERVAL_DAYS * MS_PER_DAY,
          ).toISOString(),
        };
        set((state) => ({ listings: [...state.listings, created] }));
        return id;
      },

      setListingStatus: (listingId, status) =>
        set((state) => ({
          listings: state.listings.map((listing) =>
            listing.id === listingId ? { ...listing, status } : listing,
          ),
        })),

      confirmAvailability: (listingId) => {
        const now = Date.now();
        const nowIso = new Date(now).toISOString();
        const reconfirmDueAt = new Date(
          now + RECONFIRM_INTERVAL_DAYS * MS_PER_DAY,
        ).toISOString();
        set((state) => ({
          listings: state.listings.map((listing) =>
            listing.id === listingId
              ? { ...listing, lastConfirmedAvailableAt: nowIso, reconfirmDueAt }
              : listing,
          ),
        }));
      },

      submitVerification: (v) =>
        set((state) => ({
          verifications: [
            ...state.verifications,
            {
              ...v,
              id: crypto.randomUUID(),
              status: "submitted",
              submittedAt: new Date().toISOString(),
            },
          ],
        })),

      reviewVerification: (id, status, note) => {
        const state = get();
        const verification = state.verifications.find((v) => v.id === id);
        set({
          verifications: state.verifications.map((v) =>
            v.id === id
              ? { ...v, status, reviewNote: note ?? v.reviewNote }
              : v,
          ),
          users:
            status === "approved" && verification !== undefined
              ? state.users.map((user) =>
                  user.id === verification.landlordId
                    ? { ...user, landlordVerified: true }
                    : user,
                )
              : state.users,
        });
      },

      reviewListing: (listingId, approve, note) =>
        set((state) => ({
          listings: state.listings.map((listing) =>
            listing.id === listingId
              ? {
                  ...listing,
                  status: approve ? "active" : "rejected",
                  // Approving clears any earlier rejection note (it no
                  // longer describes the listing's current state); rejecting
                  // records the reason so the landlord knows what to fix.
                  reviewNote: approve ? undefined : note,
                }
              : listing,
          ),
        })),

      resolveReport: (reportId, status) =>
        set((state) => ({
          reports: state.reports.map((report) =>
            report.id === reportId ? { ...report, status } : report,
          ),
        })),

      resetDemo: () => set({ ...seedData(), _hasHydrated: get()._hasHydrated }),
    }),
    {
      name: "hecta-demo",
      version: STORE_VERSION,
      storage: createJSONStorage(() => browserStorage()),
      // `migrate`'s return type is the full `Store`, but zustand's default
      // `merge` layers whatever this returns over a freshly-constructed
      // initial state (which already has every action + the hydration
      // slice), so returning just the persisted-data shape is sufficient in
      // practice — the cast only papers over that type/runtime mismatch.
      migrate: (persistedState, version) =>
        migratePersistedState(persistedState, version) as Store,
      // Rehydration is triggered manually (see useHydrated) so the very
      // first client render matches the server render byte-for-byte —
      // avoiding a React hydration mismatch.
      skipHydration: true,
      partialize: (state) => {
        const {
          _hasHydrated,
          setHasHydrated: _setHasHydrated,
          ...persisted
        } = state;
        return persisted;
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
