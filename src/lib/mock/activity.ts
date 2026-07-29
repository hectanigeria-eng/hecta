import type {
  Application,
  ChatMessage,
  MessageThread,
  Report,
  VerificationSubmission,
} from "@/lib/types";
import { BASE_DATE, MS_PER_DAY } from "./listings";

function daysAgo(days: number): string {
  return new Date(BASE_DATE.getTime() - days * MS_PER_DAY).toISOString();
}

// 4 applications against Amaka's listing-1 (Lekki Phase 1) and listing-2
// (Ikate) — one highly-qualified (immediate/full-payment, high budget) and
// one exploratory (instalments, low budget) application per listing, so
// qualification-based sorting has visible contrast.
export const MOCK_APPLICATIONS: Application[] = [
  {
    id: "app-1",
    listingId: "listing-1",
    applicantId: "user-chidi",
    message:
      "Hi Amaka, I'm ready to move immediately and can pay the full year upfront. Would love to schedule a viewing this week.",
    intentProfile: {
      timeline: "immediate",
      paymentPlan: "full",
      budgetMin: 3_000_000,
      budgetMax: 4_000_000,
    },
    status: "viewed",
    createdAt: daysAgo(6),
  },
  {
    id: "app-2",
    listingId: "listing-1",
    applicantId: "user-fatima",
    message:
      "Good day, I'm still exploring options in Lekki and would like more photos of the kitchen before deciding on a budget.",
    intentProfile: {
      timeline: "exploring",
      paymentPlan: "instalments",
      budgetMin: 800_000,
      budgetMax: 1_500_000,
    },
    status: "submitted",
    createdAt: daysAgo(4),
  },
  {
    id: "app-3",
    listingId: "listing-2",
    applicantId: "user-chidi",
    message:
      "This serviced flat in Ikate looks perfect for my family. I can pay in full and move in as soon as it's available.",
    intentProfile: {
      timeline: "immediate",
      paymentPlan: "full",
      budgetMin: 5_000_000,
      budgetMax: 7_000_000,
    },
    status: "viewed",
    createdAt: daysAgo(5),
  },
  {
    id: "app-4",
    listingId: "listing-2",
    applicantId: "user-fatima",
    message:
      "Just browsing serviced apartments around Ikate for now — would consider this one in a few months if it's still up.",
    intentProfile: {
      timeline: "exploring",
      paymentPlan: "instalments",
      budgetMin: 1_000_000,
      budgetMax: 2_000_000,
    },
    status: "submitted",
    createdAt: daysAgo(3),
  },
];

// Thread on the "accepted-track" application: app-1 (Chidi, immediate +
// full-payment, viewed by Amaka) — the most qualified applicant on listing-1.
export const MOCK_THREADS: MessageThread[] = [
  {
    id: "thread-1",
    applicationId: "app-1",
    listingId: "listing-1",
    participantIds: ["user-chidi", "user-amaka"],
  },
];

export const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: "msg-1",
    threadId: "thread-1",
    senderId: "user-chidi",
    body: "Hi Amaka, I'm ready to move immediately and can pay the full year upfront. Would love to schedule a viewing this week.",
    sentAt: daysAgo(6),
  },
  {
    id: "msg-2",
    threadId: "thread-1",
    senderId: "user-amaka",
    body: "Hi Tunde... I mean Chidi, thanks for reaching out! The flat is still available. I can do a viewing Thursday afternoon, does that work?",
    sentAt: daysAgo(5),
  },
  {
    id: "msg-3",
    threadId: "thread-1",
    senderId: "user-chidi",
    body: "Thursday afternoon works well for me. Could you also confirm what the caution deposit covers before I come by?",
    sentAt: daysAgo(5),
  },
  {
    id: "msg-4",
    threadId: "thread-1",
    senderId: "user-amaka",
    body: "Sure — the caution deposit is fully refundable at the end of the lease, provided there's no damage beyond normal wear. See you Thursday.",
    sentAt: daysAgo(4),
  },
];

// 3 open reports (distinct reporters) against listing-34 — meets
// AUTO_SUSPEND_REPORT_COUNT, matching listing-34's "suspended" status — plus
// 1 open report against listing-3.
export const MOCK_REPORTS: Report[] = [
  {
    id: "report-1",
    targetListingId: "listing-34",
    reporterId: "user-tunde",
    category: "scam_listing",
    reason:
      "Price is far below every comparable 3-bed flat in Sabo — looks like a bait listing to collect an upfront deposit.",
    status: "open",
    createdAt: daysAgo(9),
  },
  {
    id: "report-2",
    targetListingId: "listing-34",
    reporterId: "user-chidi",
    category: "scam_listing",
    reason:
      "Contacted the poster and they asked for a caution deposit transfer before any viewing was arranged.",
    status: "open",
    createdAt: daysAgo(8),
  },
  {
    id: "report-3",
    targetListingId: "listing-34",
    reporterId: "user-fatima",
    category: "agent_posing",
    reason:
      "The person replying to messages claims to be the landlord but the phone number is registered to a different name.",
    status: "open",
    createdAt: daysAgo(7),
  },
  {
    id: "report-4",
    targetListingId: "listing-3",
    reporterId: "user-tunde",
    category: "agent_posing",
    reason:
      "Whoever is responding to enquiries on this listing doesn't seem to know basic details about the unit — suspect it isn't the actual owner.",
    status: "open",
    createdAt: daysAgo(2),
  },
];

// Verification submissions: one approved, one freshly submitted (backing
// listing-31's address, still pending_review), one sent back for more info.
export const MOCK_VERIFICATIONS: VerificationSubmission[] = [
  {
    id: "verification-1",
    landlordId: "user-amaka",
    landlordName: "Amaka Obi",
    nin: "***********1234",
    propertyAddress: "Admiralty Way, Lekki Phase 1, Eti-Osa, Lagos",
    ownershipDocType: "c_of_o",
    legitimacyDoc: "survey_plan",
    status: "approved",
    submittedAt: daysAgo(120),
    reviewNote:
      "C of O and survey plan verified against the Lagos land registry — approved.",
  },
  {
    id: "verification-2",
    landlordId: "user-emeka",
    landlordName: "Emeka Nwachukwu",
    nin: "***********5678",
    propertyAddress: "University Road, Akoka, Yaba, Lagos",
    ownershipDocType: "family_resolution",
    legitimacyDoc: "none",
    status: "submitted",
    submittedAt: daysAgo(3),
  },
  {
    id: "verification-3",
    landlordId: "ll-seed-3",
    landlordName: "Suleiman Danjuma",
    nin: "***********9012",
    propertyAddress: "10th Avenue, Gwarinpa, AMAC, Abuja",
    ownershipDocType: "purchase_receipt",
    legitimacyDoc: "luc_receipt",
    status: "info_requested",
    submittedAt: daysAgo(11),
    reviewNote:
      "Purchase receipt provided doesn't match the seller name on the LUC receipt — please resubmit with matching documents.",
  },
];
