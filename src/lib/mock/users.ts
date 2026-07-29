import type { User } from "@/lib/types";

export const MOCK_USERS: User[] = [
  {
    id: "anonymous",
    personaId: "anonymous",
    name: "Guest",
    identityVerified: false,
    landlordVerified: false,
  },
  {
    id: "user-tunde",
    personaId: "tenant",
    name: "Tunde Bakare",
    identityVerified: true,
    landlordVerified: false,
    intentProfile: {
      timeline: "within_1_month",
      paymentPlan: "full",
      budgetMin: 1_500_000,
      budgetMax: 4_000_000,
    },
  },
  {
    id: "user-amaka",
    personaId: "landlord",
    name: "Amaka Obi",
    identityVerified: true,
    landlordVerified: true,
  },
  {
    id: "user-admin",
    personaId: "admin",
    name: "Hecta Admin",
    identityVerified: true,
    landlordVerified: false,
  },
  // Extra seeker users — authors of the seeded applications in activity.ts.
  {
    id: "user-chidi",
    personaId: "tenant",
    name: "Chidi Eze",
    identityVerified: true,
    landlordVerified: false,
    intentProfile: {
      timeline: "immediate",
      paymentPlan: "full",
      budgetMin: 3_000_000,
      budgetMax: 6_500_000,
    },
  },
  {
    id: "user-fatima",
    personaId: "tenant",
    name: "Fatima Suleiman",
    identityVerified: true,
    landlordVerified: false,
    intentProfile: {
      timeline: "exploring",
      paymentPlan: "instalments",
      budgetMin: 500_000,
      budgetMax: 1_800_000,
    },
  },
  // Extra landlord — owns the pending (unverified) verification submission.
  {
    id: "user-emeka",
    personaId: "landlord",
    name: "Emeka Nwachukwu",
    identityVerified: true,
    landlordVerified: false,
  },
  // Seed landlords backing rows 3–36 of the listing inventory.
  {
    id: "ll-seed-1",
    personaId: "landlord",
    name: "Bola Adesanya",
    identityVerified: true,
    landlordVerified: true,
  },
  {
    id: "ll-seed-2",
    personaId: "landlord",
    name: "Ifeoma Chukwu",
    identityVerified: true,
    landlordVerified: true,
  },
  {
    id: "ll-seed-3",
    personaId: "landlord",
    name: "Suleiman Danjuma",
    identityVerified: true,
    landlordVerified: true,
  },
];
