"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

export const LANGS = [
  { code: "en", label: "English", short: "EN" },
  { code: "pcm", label: "Naijá (Pidgin)", short: "PCM" },
  { code: "yo", label: "Yorùbá", short: "YO" },
  { code: "ig", label: "Igbo", short: "IG" },
  { code: "ha", label: "Hausa", short: "HA" },
] as const;

export type Lang = (typeof LANGS)[number]["code"];

/* ── English: source of truth ───────────────────────────── */
const en = {
  nav: {
    rent: "Rent",
    buy: "Buy",
    list: "List property",
    howItWorks: "How it works",
    getStarted: "Get started",
  },
  rating: { on: "on" },
  hero: {
    title: "Rent or buy a home you can trust",
    browse: "Browse listings",
  },
  calc: {
    title: "See how much you save",
    sub: "No agency fees. No legal fees.",
    annualRent: "Annual rent",
    perYear: "per year",
    agency: "Agency fee (25%)",
    legal: "Legal fee (10%)",
    youSave: "You save",
    cta: "Browse fee-free homes",
  },
  doMore: {
    heading: "Do more with Hecta",
    browse: "Browse listings",
    search: {
      label: "Search",
      desc: "thousands of verified rentals and homes for sale across Lagos, filtered your way",
    },
    verify: {
      label: "Verify",
      desc: "every landlord and property up front, so you never deal with agents or scams",
    },
    apply: {
      label: "Apply",
      desc: "to listings and message landlords directly, all from one place",
    },
    moveIn: {
      label: "Move in",
      desc: "with an auto-generated tenancy agreement — no lawyer fees, no back-and-forth",
    },
  },
  earn: {
    line1: "List smarter.",
    line2: "Rent faster.",
    body: "Become a verified landlord and reach serious, verified tenants, get matched instantly from our live demand pool, manage everything from WhatsApp, and enjoy member-only priority placement.",
    listCta: "List your property",
    seeHow: "See how it works",
  },
  features: {
    learnMore: "Learn more",
    verified: {
      eyebrow: "Verified listings",
      line1: "Every home,",
      line2: "actually verified",
      body: "No agents, no ghost listings, no surprises. Every landlord is identity-checked and every property is confirmed with real ownership documents before it goes live. What you see is what you rent.",
    },
    search: {
      eyebrow: "Smart search",
      line1: "Find the right",
      line2: "home, faster",
      body: "Tell us whether you want to rent or buy, choose your area, and filter by price, bedrooms, furnishing, serviced level, pets, and move-in date. The right place is only a few taps away.",
    },
    trust: {
      eyebrow: "Trust & safety",
      line1: "Rent without",
      line2: "the runaround",
      body: "Identity and intent checks keep tenants and landlords genuine, while spam detection, duplicate flags, and easy reporting keep scams out. Rent with people you can actually count on.",
    },
    agreements: {
      eyebrow: "Tenancy agreements",
      line1: "Sign your lease",
      line2: "in minutes",
      body: "Skip the lawyer fees. Hecta auto-generates your tenancy agreement from the property and rent terms, with editable clauses for payment, maintenance, and notice. Export to PDF and sign digitally.",
    },
    demand: {
      eyebrow: "Live demand pool",
      line1: "Let the right",
      line2: "home find you",
      body: "Post what you’re looking for and your budget, and landlords with matching properties come to you. It flips the search around — verified tenants get notified the moment the right home is listed.",
    },
  },
  benefits: {
    eyebrow: "Why Hecta",
    heading: "Whether you’re moving in or renting out",
    sub: "Hecta is built for both sides of the deal — fair, fast, and free of the fees and games.",
    seekerTag: "For home seekers",
    seekerTitle: "Find a home, fee-free",
    seekerCta: "Browse listings",
    landlordTag: "For landlords",
    landlordTitle: "Rent out with confidence",
    landlordCta: "List your property",
    seekerItems: [
      "Verified listings only — no agents, no ghost listings, no scams",
      "Pay zero agency and legal fees — save up to 35% on every move",
      "Smart filters for price, bedrooms, furnishing, serviced level and pets",
      "Message verified landlords directly, no middlemen",
      "Auto-generated tenancy agreement — sign in minutes, no lawyer",
      "Post what you want and let matching homes come to you",
    ],
    landlordItems: [
      "Reach verified, serious tenants ready to move",
      "Get matched instantly from the live demand pool",
      "Manage listings and chats right from WhatsApp",
      "Priority placement for verified properties",
      "ID and intent checks filter out time-wasters",
      "Built-in agreements and digital signing close deals faster",
    ],
  },
  safe: {
    heading: "Built on trust, not luck",
    cards: [
      {
        title: "Verified landlords",
        body: "Every landlord is identity-checked with NIN and proof of ownership before they can list.",
      },
      {
        title: "Real properties only",
        body: "We validate documents and flag duplicates, ghost listings, and suspicious pricing.",
      },
      {
        title: "Serious people only",
        body: "Liveness checks and intent profiles keep tenants and buyers genuine.",
      },
    ],
  },
  reviews: {
    eyebrow: "Loved across Lagos",
    heading: "Renters and landlords trust Hecta",
    statLabels: [
      "saved in agent & legal fees",
      "verified listings in Lagos",
      "renters & landlords",
      "average app rating",
    ],
    roles: { tenant: "Tenant", landlord: "Landlord", buyer: "Buyer" },
  },
  cta: {
    line1: "Find your next home",
    line2: "without the stress",
    button: "Start your search",
  },
  footer: {
    tagline:
      "Rent or buy a home you can trust — verified listings across Lagos, with zero agent and legal fees.",
    newsletter: "Get new listings in your inbox",
    emailPlaceholder: "Enter your email",
    subscribe: "Subscribe",
    getApp: "Get the Hecta app",
    scan: "Scan to download for iOS & Android",
    explore: "Explore",
    discover: "Discover",
    links: {
      rentHome: "Rent a home",
      buyHome: "Buy a home",
      listProperty: "List your property",
      verifiedLandlords: "Verified landlords",
      howItWorks: "How it works",
      whyHecta: "Why Hecta",
      reviews: "Reviews",
      getTheApp: "Get the app",
    },
  },
  waitlist: {
    floating: "Join waitlist",
    title: "If you support this, sign up",
    desc: "Join the waitlist for early access to verified, fee-free homes across Lagos.",
    firstName: "First name",
    lastName: "Last name",
    email: "Email address",
    location: "Location (e.g. Lekki, Lagos)",
    budget: "Budget range",
    timeline: "Move-in timeline",
    submit: "Sign up",
    budgetOptions: [
      "Under ₦1M / year",
      "₦1M – ₦3M / year",
      "₦3M – ₦6M / year",
      "₦6M – ₦12M / year",
      "₦12M+ / year",
    ],
    timelineOptions: [
      "Immediately",
      "Within 1 month",
      "1 – 3 months",
      "3 – 6 months",
      "Just exploring",
    ],
    successTitle: "You’re on the list!",
    successBody:
      "Thanks for supporting Hecta. We’ll email you the moment early access opens in your area.",
    done: "Done",
  },
};

export type Messages = typeof en;
type DeepPartial<T> = T extends (infer _U)[]
  ? T
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

/* ── Nigerian Pidgin ────────────────────────────────────── */
const pcm: DeepPartial<Messages> = {
  nav: {
    rent: "Rent",
    buy: "Buy",
    list: "List your house",
    howItWorks: "How e dey work",
    getStarted: "Start now",
  },
  hero: {
    title: "Rent or buy house wey you fit trust",
    browse: "Check listings",
  },
  calc: {
    title: "See how much you go save",
    sub: "No agency fee. No legal fee.",
    annualRent: "Yearly rent",
    perYear: "per year",
    agency: "Agency fee (25%)",
    legal: "Legal fee (10%)",
    youSave: "You go save",
    cta: "Check houses wey no get fee",
  },
  doMore: {
    heading: "Do more with Hecta",
    browse: "Check listings",
    search: {
      label: "Search",
      desc: "plenty verified houses for rent and for sale all over Lagos, the way you want am",
    },
    verify: {
      label: "Verify",
      desc: "every landlord and house before, so you no go deal with agent or scam",
    },
    apply: {
      label: "Apply",
      desc: "to houses and message landlord direct, all for one place",
    },
    moveIn: {
      label: "Move in",
      desc: "with tenancy agreement wey we go arrange — no lawyer fee, no wahala",
    },
  },
  earn: {
    line1: "List am well.",
    line2: "Rent am fast.",
    body: "Become verified landlord and reach serious tenants wey we don check, see matches sharp-sharp from our demand pool, run everything from WhatsApp, and enjoy front-row placement for members.",
    listCta: "List your house",
    seeHow: "See how e dey work",
  },
  features: {
    learnMore: "Learn more",
    verified: {
      eyebrow: "Verified houses",
      line1: "Every house,",
      line2: "we don verify am",
      body: "No agent, no fake listing, no surprise. We dey check every landlord identity and confirm every house with real ownership paper before e go up. Wetin you see na wetin you go rent.",
    },
    search: {
      eyebrow: "Smart search",
      line1: "Find the correct",
      line2: "house, quick",
      body: "Tell us if you wan rent or buy, choose your area, and filter by price, rooms, furnishing, serviced level, pets, and when you wan move in. The correct place na just few taps.",
    },
    trust: {
      eyebrow: "Trust & safety",
      line1: "Rent without",
      line2: "the stress",
      body: "We dey check identity and intent so tenant and landlord go dey genuine, while we dey catch spam, duplicate, and easy report dey keep scam outside. Rent with people wey you fit trust.",
    },
    agreements: {
      eyebrow: "Tenancy agreement",
      line1: "Sign your lease",
      line2: "for minutes",
      body: "Forget lawyer fee. Hecta go arrange your tenancy agreement from the house and rent terms, with clauses you fit edit for payment, maintenance, and notice. Export to PDF and sign am online.",
    },
    demand: {
      eyebrow: "Live demand pool",
      line1: "Make the correct",
      line2: "house find you",
      body: "Post wetin you dey find and your budget, make landlord wey get matching house come meet you. E turn the search upside down — verified tenant go hear sharp-sharp when the correct house show.",
    },
  },
  benefits: {
    eyebrow: "Why Hecta",
    heading: "Whether you dey move in or you wan rent am out",
    sub: "Hecta dey work for both sides — fair, fast, and no fee or games.",
    seekerTag: "For house seekers",
    seekerTitle: "Find house, no fee",
    seekerCta: "Check listings",
    landlordTag: "For landlords",
    landlordTitle: "Rent am out with confidence",
    landlordCta: "List your house",
    seekerItems: [
      "Na verified listings only — no agent, no fake listing, no scam",
      "Pay zero agency and legal fee — save reach 35% every time you move",
      "Smart filters for price, rooms, furnishing, serviced level and pets",
      "Message verified landlord direct, no middleman",
      "Tenancy agreement wey ready sharp — sign for minutes, no lawyer",
      "Post wetin you want make matching house come find you",
    ],
    landlordItems: [
      "Reach verified serious tenants wey ready to move",
      "See matches sharp-sharp from the live demand pool",
      "Run your listings and chats from WhatsApp",
      "Front placement for verified houses",
      "ID and intent check dey commot time-wasters",
      "Agreement and online signing dey close deals fast",
    ],
  },
  safe: {
    heading: "We build am on trust, no be luck",
    cards: [
      {
        title: "Verified landlords",
        body: "We dey check every landlord with NIN and ownership proof before dem fit list.",
      },
      {
        title: "Real houses only",
        body: "We dey confirm papers and flag duplicate, fake listing, and price wey dey suspicious.",
      },
      {
        title: "Serious people only",
        body: "Liveness check and intent profile dey make sure tenant and buyer dey genuine.",
      },
    ],
  },
  reviews: {
    eyebrow: "Lagos people love am",
    heading: "Tenants and landlords trust Hecta",
    statLabels: [
      "wey people don save for agent & legal fee",
      "verified listings for Lagos",
      "tenants & landlords",
      "average app rating",
    ],
    roles: { tenant: "Tenant", landlord: "Landlord", buyer: "Buyer" },
  },
  cta: {
    line1: "Find your next house",
    line2: "without stress",
    button: "Start your search",
  },
  footer: {
    tagline:
      "Rent or buy house wey you fit trust — verified listings for Lagos, with zero agent and legal fee.",
    newsletter: "Get new listings for your inbox",
    emailPlaceholder: "Enter your email",
    subscribe: "Subscribe",
    getApp: "Get the Hecta app",
    scan: "Scan to download for iOS & Android",
    explore: "Explore",
    discover: "Discover",
    links: {
      rentHome: "Rent house",
      buyHome: "Buy house",
      listProperty: "List your house",
      verifiedLandlords: "Verified landlords",
      howItWorks: "How e dey work",
      whyHecta: "Why Hecta",
      reviews: "Reviews",
      getTheApp: "Get the app",
    },
  },
  waitlist: {
    floating: "Join waitlist",
    title: "If you support this, sign up",
    desc: "Join the waitlist make you first get verified, no-fee houses for Lagos.",
    firstName: "First name",
    lastName: "Last name",
    email: "Email address",
    location: "Location (e.g. Lekki, Lagos)",
    budget: "Budget range",
    timeline: "When you wan move in",
    submit: "Sign up",
    budgetOptions: [
      "Under ₦1M / year",
      "₦1M – ₦3M / year",
      "₦3M – ₦6M / year",
      "₦6M – ₦12M / year",
      "₦12M+ / year",
    ],
    timelineOptions: [
      "Now-now",
      "Within 1 month",
      "1 – 3 months",
      "3 – 6 months",
      "Just dey check",
    ],
    successTitle: "You don dey the list!",
    successBody:
      "Thank you for supporting Hecta. We go email you sharp-sharp when early access open for your area.",
    done: "Done",
  },
};

/* ── Yorùbá ──────────────────────────────────────────────── */
const yo: DeepPartial<Messages> = {
  nav: {
    rent: "Háyà",
    buy: "Rà",
    list: "Fi ilé sí",
    howItWorks: "Bí ó ṣe ń ṣiṣẹ́",
    getStarted: "Bẹ̀rẹ̀",
  },
  hero: {
    title: "Háyà tàbí ra ilé tí o lè gbẹ́kẹ̀lé",
    browse: "Wo àwọn ilé",
  },
  calc: {
    title: "Wo iye tí o máa fi pamọ́",
    sub: "Kò sí owó aṣojú. Kò sí owó agbẹjọ́rò.",
    annualRent: "Háyà ọdún",
    perYear: "lọ́dọọdún",
    agency: "Owó aṣojú (25%)",
    legal: "Owó agbẹjọ́rò (10%)",
    youSave: "O fi pamọ́",
    cta: "Wo ilé tí kò ní owó àfikún",
  },
  doMore: {
    heading: "Ṣe púpọ̀ pẹ̀lú Hecta",
    browse: "Wo àwọn ilé",
    search: {
      label: "Wá",
      desc: "ẹgbẹẹgbẹ̀rún ilé háyà àti títà tí a ti fọwọ́sí kárí Èkó, bí o ṣe fẹ́",
    },
    verify: {
      label: "Fọwọ́sí",
      desc: "gbogbo onílé àti ilé ṣáájú, kí o má bàa bá aṣojú tàbí ẹ̀tàn",
    },
    apply: {
      label: "Bẹ̀wẹ̀",
      desc: "sí àwọn ilé kí o sì bá onílé sọ̀rọ̀ tààrà, gbogbo rẹ̀ ní ibì kan",
    },
    moveIn: {
      label: "Wọlé",
      desc: "pẹ̀lú ìwé àdéhùn háyà tí a ṣe fún ọ — kò sí owó agbẹjọ́rò, kò sí wàhálà",
    },
  },
  earn: {
    line1: "Fi ilé sí lọ́gbọ́n.",
    line2: "Háyà yára.",
    body: "Di onílé tí a ti fọwọ́sí kí o sì dé ọ̀dọ̀ àwọn ayálégbé pàtàkì, rí ìbámu lẹ́sẹ̀kẹsẹ̀ láti inú àdìpọ̀ ìbéèrè wa, ṣàkóso ohun gbogbo láti WhatsApp, kí o sì gbádùn ipò àkọ́kọ́ fún àwọn ọmọ ẹgbẹ́.",
    listCta: "Fi ilé rẹ sí",
    seeHow: "Wo bí ó ṣe ń ṣiṣẹ́",
  },
  features: {
    learnMore: "Kọ́ síi",
    verified: {
      eyebrow: "Ilé tí a fọwọ́sí",
      line1: "Gbogbo ilé,",
      line2: "tí a ti fọwọ́sí ní tòótọ́",
      body: "Kò sí aṣojú, kò sí ilé asán, kò sí ìyàlẹ́nu. A ń ṣàyẹ̀wò ìdánimọ̀ gbogbo onílé, a sì ń fìdí ilé múlẹ̀ pẹ̀lú ìwé ìní gidi kí ó tó jáde. Ohun tí o rí ni ohun tí o máa háyà.",
    },
    search: {
      eyebrow: "Ìwáàrí ọlọ́gbọ́n",
      line1: "Wá ilé tó tọ́",
      line2: "ní kíákíá",
      body: "Sọ fún wa bóyá o fẹ́ háyà tàbí rà, yan agbègbè rẹ, kí o sì ṣèdíwọ̀n nípa iye owó, iyàrá, ohun èlò, ìpele iṣẹ́, ohun ọ̀sìn, àti ọjọ́ ìwọlé. Ibì tó tọ́ kàn jẹ́ ìtẹ̀ díẹ̀.",
    },
    trust: {
      eyebrow: "Ìgbẹ́kẹ̀lé & ààbò",
      line1: "Háyà láìní",
      line2: "ìdààmú",
      body: "Àyẹ̀wò ìdánimọ̀ àti èrò ń jẹ́ kí ayálégbé àti onílé jẹ́ olóòótọ́, nígbà tí ìmọ̀ ẹ̀tàn àti ìròyìn rírọrùn ń ṣamójútó ẹ̀tàn. Háyà pẹ̀lú àwọn ènìyàn tí o lè gbẹ́kẹ̀lé.",
    },
    agreements: {
      eyebrow: "Ìwé àdéhùn háyà",
      line1: "Buwọ́lu ìwé rẹ",
      line2: "láàárín ìṣẹ́jú",
      body: "Fi owó agbẹjọ́rò sílẹ̀. Hecta máa ṣe ìwé àdéhùn háyà rẹ láti inú ilé àti àwọn òfin háyà, pẹ̀lú àwọn gbólóhùn tí o lè ṣàtúnṣe fún sísanwó, ìtọ́jú, àti ìkìlọ̀. Tú sí PDF kí o sì buwọ́lu lórí ẹ̀rọ.",
    },
    demand: {
      eyebrow: "Àdìpọ̀ ìbéèrè",
      line1: "Jẹ́ kí ilé tó tọ́",
      line2: "wá rí ọ",
      body: "Fi ohun tí o ń wá àti owó rẹ sí, àwọn onílé tí ó ní ilé tó bá a mu yóò wá bá ọ. Ó yí ìwáàrí padà — ayálégbé tí a fọwọ́sí yóò gbọ́ lẹ́sẹ̀kẹsẹ̀ tí ilé tó tọ́ bá jáde.",
    },
  },
  benefits: {
    eyebrow: "Kí nìdí Hecta",
    heading: "Yálà o ń wọlé tàbí o ń háyà jáde",
    sub: "A kọ́ Hecta fún ẹ̀gbẹ́ méjèèjì — déédéé, yára, láìní owó àfikún àti eré.",
    seekerTag: "Fún àwọn olùwá ilé",
    seekerTitle: "Wá ilé, láìní owó àfikún",
    seekerCta: "Wo àwọn ilé",
    landlordTag: "Fún àwọn onílé",
    landlordTitle: "Háyà jáde pẹ̀lú ìgbẹ́kẹ̀lé",
    landlordCta: "Fi ilé rẹ sí",
    seekerItems: [
      "Ilé tí a fọwọ́sí nìkan — kò sí aṣojú, kò sí ilé asán, kò sí ẹ̀tàn",
      "Sanwó odo fún aṣojú àti agbẹjọ́rò — fi tó 35% pamọ́ nígbà gbogbo",
      "Àwọn ìdíwọ̀n ọlọ́gbọ́n fún owó, iyàrá, ohun èlò, ìpele iṣẹ́ àti ohun ọ̀sìn",
      "Bá onílé tí a fọwọ́sí sọ̀rọ̀ tààrà, láìní alárinà",
      "Ìwé àdéhùn háyà tí ó ti ṣetán — buwọ́lu láàárín ìṣẹ́jú, láìní agbẹjọ́rò",
      "Fi ohun tí o fẹ́ sí kí àwọn ilé tó bá a mu wá bá ọ",
    ],
    landlordItems: [
      "Dé ọ̀dọ̀ àwọn ayálégbé pàtàkì tí ó ti ṣetán láti wọlé",
      "Rí ìbámu lẹ́sẹ̀kẹsẹ̀ láti inú àdìpọ̀ ìbéèrè",
      "Ṣàkóso àwọn ilé àti ìjíròrò rẹ láti WhatsApp",
      "Ipò àkọ́kọ́ fún àwọn ilé tí a fọwọ́sí",
      "Àyẹ̀wò ìdánimọ̀ àti èrò ń yọ àwọn afẹ́gbáàkókò kúrò",
      "Ìwé àdéhùn àti ìbúwọ́lù orí ẹ̀rọ ń parí àdéhùn kíákíá",
    ],
  },
  safe: {
    heading: "A gbé e ka ìgbẹ́kẹ̀lé, kì í ṣe oríire",
    cards: [
      {
        title: "Onílé tí a fọwọ́sí",
        body: "A ń ṣàyẹ̀wò gbogbo onílé pẹ̀lú NIN àti ẹ̀rí ìní kí wọ́n tó lè fi ilé sí.",
      },
      {
        title: "Ilé gidi nìkan",
        body: "A ń fọwọ́sí àwọn ìwé, a sì ń sàmì sí ìbéjì, ilé asán, àti iye owó tó fura.",
      },
      {
        title: "Ènìyàn pàtàkì nìkan",
        body: "Àyẹ̀wò ìwàláàyè àti èrò ń jẹ́ kí ayálégbé àti olùrà jẹ́ olóòótọ́.",
      },
    ],
  },
  reviews: {
    eyebrow: "Ìfẹ́ kárí Èkó",
    heading: "Ayálégbé àti onílé gbẹ́kẹ̀lé Hecta",
    statLabels: [
      "tí a fi pamọ́ nínú owó aṣojú & agbẹjọ́rò",
      "ilé tí a fọwọ́sí ní Èkó",
      "ayálégbé & onílé",
      "ìdíwọ̀n àpapọ̀ app",
    ],
    roles: { tenant: "Ayálégbé", landlord: "Onílé", buyer: "Olùrà" },
  },
  cta: {
    line1: "Wá ilé rẹ tó kàn",
    line2: "láìní ìdààmú",
    button: "Bẹ̀rẹ̀ ìwáàrí rẹ",
  },
  footer: {
    tagline:
      "Háyà tàbí ra ilé tí o lè gbẹ́kẹ̀lé — ilé tí a fọwọ́sí kárí Èkó, láìní owó aṣojú àti agbẹjọ́rò.",
    newsletter: "Gba àwọn ilé tuntun sí inbox rẹ",
    emailPlaceholder: "Tẹ imeèlì rẹ sí",
    subscribe: "Forúkọ sílẹ̀",
    getApp: "Gba app Hecta",
    scan: "Scan láti gbà fún iOS & Android",
    explore: "Ṣàwárí",
    discover: "Ṣàwáàrí",
    links: {
      rentHome: "Háyà ilé",
      buyHome: "Ra ilé",
      listProperty: "Fi ilé rẹ sí",
      verifiedLandlords: "Onílé tí a fọwọ́sí",
      howItWorks: "Bí ó ṣe ń ṣiṣẹ́",
      whyHecta: "Kí nìdí Hecta",
      reviews: "Àwọn àtúnyẹ̀wò",
      getTheApp: "Gba app náà",
    },
  },
  waitlist: {
    floating: "Dárapọ̀ mọ́ àtòjọ",
    title: "Tí o bá ti ìgbésẹ̀ yìí lẹ́yìn, forúkọ sílẹ̀",
    desc: "Dárapọ̀ mọ́ àtòjọ ìdúró fún ànfààní àkọ́kọ́ sí ilé tí a fọwọ́sí, láìní owó, kárí Èkó.",
    firstName: "Orúkọ àkọ́kọ́",
    lastName: "Orúkọ ìdílé",
    email: "Àdírẹ́sì imeèlì",
    location: "Ibùdó (b.a. Lekki, Èkó)",
    budget: "Iye owó tó wà",
    timeline: "Ìgbà ìwọlé",
    submit: "Forúkọ sílẹ̀",
    timelineOptions: [
      "Lẹ́sẹ̀kẹsẹ̀",
      "Láàárín oṣù kan",
      "Oṣù 1 – 3",
      "Oṣù 3 – 6",
      "Ń ṣàwárí lásán",
    ],
    successTitle: "O ti wà nínú àtòjọ!",
    successBody:
      "A dúpẹ́ pé o ti Hecta lẹ́yìn. A máa fi imeèlì ránṣẹ́ sí ọ lẹ́sẹ̀kẹsẹ̀ tí ànfààní àkọ́kọ́ bá ṣí ní agbègbè rẹ.",
    done: "Ó parí",
  },
};

/* ── Igbo ────────────────────────────────────────────────── */
const ig: DeepPartial<Messages> = {
  nav: {
    rent: "Gbaa",
    buy: "Zụta",
    list: "Debe ụlọ",
    howItWorks: "Otú o si arụ ọrụ",
    getStarted: "Malite",
  },
  hero: {
    title: "Gbaa ma ọ bụ zụta ụlọ ị nwere ike ịtụkwasị obi",
    browse: "Lelee ụlọ",
  },
  calc: {
    title: "Lee ego ole ị ga-echekwa",
    sub: "Enweghị ụgwọ onye nnọchite anya. Enweghị ụgwọ ọkàiwu.",
    annualRent: "Mgbazinye kwa afọ",
    perYear: "kwa afọ",
    agency: "Ụgwọ onye nnọchi (25%)",
    legal: "Ụgwọ ọkàiwu (10%)",
    youSave: "Ị na-echekwa",
    cta: "Lelee ụlọ na-enweghị ụgwọ",
  },
  doMore: {
    heading: "Mee ihe karịrị site na Hecta",
    browse: "Lelee ụlọ",
    search: {
      label: "Chọọ",
      desc: "ọtụtụ puku ụlọ mgbazinye na nke a na-ere na Lagos, otú ị chọrọ ya",
    },
    verify: {
      label: "Nyochaa",
      desc: "onye nwe ụlọ ọ bụla na ụlọ tupu, ka ị ghara ime ihe na ndị nnọchi ma ọ bụ aghụghọ",
    },
    apply: {
      label: "Tinye akwụkwọ",
      desc: "na ụlọ ndị dị ma zigara ndị nwe ụlọ ozi ozugbo, n'otu ebe",
    },
    moveIn: {
      label: "Bata",
      desc: "site na nkwekọrịta mgbazinye anyị na-emepụta — enweghị ụgwọ ọkàiwu, enweghị nsogbu",
    },
  },
  earn: {
    line1: "Debe ya nke ọma.",
    line2: "Gbaa ya ọsọ.",
    body: "Bụrụ onye nwe ụlọ a nyochara ma ruo ndị mgbazinye dị mkpa, nweta ndakọrịta ozugbo site na ọdọ mmiri ọchịchọ anyị, jikwaa ihe niile site na WhatsApp, ma nweta ọnọdụ mbụ maka ndị otu.",
    listCta: "Debe ụlọ gị",
    seeHow: "Lee otú o si arụ ọrụ",
  },
  features: {
    learnMore: "Mụtakwuo",
    verified: {
      eyebrow: "Ụlọ a nyochara",
      line1: "Ụlọ ọ bụla,",
      line2: "nke a nyochachara",
      body: "Enweghị ndị nnọchi, enweghị ụlọ efu, enweghị ihe ijuanya. A na-enyocha njirimara onye nwe ụlọ ọ bụla ma kwado ụlọ ọ bụla site na akwụkwọ nwe ụlọ tupu o pụta. Ihe ị na-ahụ bụ ihe ị ga-agba.",
    },
    search: {
      eyebrow: "Nchọ amamihe",
      line1: "Chọta ụlọ kwesịrị",
      line2: "ngwa ngwa",
      body: "Gwa anyị ma ị chọrọ ịgba ma ọ bụ ịzụta, họrọ mpaghara gị, ma nyochaa site na ọnụ ahịa, ọnụ ụlọ, ngwa ụlọ, ọkwa ọrụ, anụ ụlọ, na ụbọchị ịbata. Ebe ziri ezi bụ naanị mpị ole na ole.",
    },
    trust: {
      eyebrow: "Ntụkwasị obi & nchekwa",
      line1: "Gbaa na-enweghị",
      line2: "nsogbu",
      body: "Nyocha njirimara na ebumnuche na-eme ka ndị mgbazinye na ndị nwe ụlọ bụrụ ndị eziokwu, ebe nchọpụta aghụghọ na mkpesa dị mfe na-egbochi aghụghọ. Gbaa na ndị ị nwere ike ịdabere na ha.",
    },
    agreements: {
      eyebrow: "Nkwekọrịta mgbazinye",
      line1: "Bịanye aka na lease gị",
      line2: "n'ime nkeji",
      body: "Wepụ ụgwọ ọkàiwu. Hecta na-emepụta nkwekọrịta mgbazinye gị site na ụlọ na usoro mgbazinye, na nkebi ị nwere ike idezi maka ịkwụ ụgwọ, mmezi, na ọkwa. Bupụ na PDF ma bịanye aka n'ụzọ dijitalụ.",
    },
    demand: {
      eyebrow: "Ọdọ mmiri ọchịchọ",
      line1: "Kwere ka ụlọ ziri ezi",
      line2: "chọta gị",
      body: "Detuo ihe ị na-achọ na ego gị, ndị nwe ụlọ nwere ụlọ dabara ga-abịakwute gị. Ọ na-atụgharị nchọ — ndị mgbazinye a nyochara na-anụ ozugbo mgbe ụlọ ziri ezi pụtara.",
    },
  },
  benefits: {
    eyebrow: "Gịnị kpatara Hecta",
    heading: "Ma ị na-abata ma ọ bụ na-agbazinye",
    sub: "Ewuru Hecta maka akụkụ abụọ — ziri ezi, ngwa ngwa, na enweghị ụgwọ na egwuregwu.",
    seekerTag: "Maka ndị na-achọ ụlọ",
    seekerTitle: "Chọta ụlọ, enweghị ụgwọ",
    seekerCta: "Lelee ụlọ",
    landlordTag: "Maka ndị nwe ụlọ",
    landlordTitle: "Gbazinye na obi ike",
    landlordCta: "Debe ụlọ gị",
    seekerItems: [
      "Naanị ụlọ a nyochara — enweghị ndị nnọchi, ụlọ efu, ma ọ bụ aghụghọ",
      "Kwụọ efu maka onye nnọchi na ọkàiwu — chekwaa ruo 35% mgbe ọ bụla",
      "Nzacha amamihe maka ọnụ ahịa, ọnụ ụlọ, ngwa ụlọ, ọkwa ọrụ na anụ ụlọ",
      "Zigara ndị nwe ụlọ a nyochara ozi ozugbo, enweghị onye etiti",
      "Nkwekọrịta mgbazinye dị njikere — bịanye aka n'ime nkeji, enweghị ọkàiwu",
      "Detuo ihe ị chọrọ ka ụlọ dabara bịakwute gị",
    ],
    landlordItems: [
      "Ruo ndị mgbazinye dị mkpa dị njikere ịbata",
      "Nweta ndakọrịta ozugbo site na ọdọ mmiri ọchịchọ",
      "Jikwaa ụlọ na mkparịta ụka gị site na WhatsApp",
      "Ọnọdụ mbụ maka ụlọ a nyochara",
      "Nyocha njirimara na ebumnuche na-ewepụ ndị na-egbu oge",
      "Nkwekọrịta na ịbịanye aka dijitalụ na-emechi azụmahịa ngwa ngwa",
    ],
  },
  safe: {
    heading: "Ewuru ya n'elu ntụkwasị obi, ọ bụghị ch'oma",
    cards: [
      {
        title: "Ndị nwe ụlọ a nyochara",
        body: "A na-enyocha onye nwe ụlọ ọ bụla site na NIN na akwụkwọ nwe tupu ha enwee ike idebe.",
      },
      {
        title: "Naanị ezigbo ụlọ",
        body: "Anyị na-enyocha akwụkwọ ma kọwapụta oyiri, ụlọ efu, na ọnụ ahịa na-enyo enyo.",
      },
      {
        title: "Naanị ndị dị mkpa",
        body: "Nyocha ịdị ndụ na profaịlụ ebumnuche na-eme ka ndị mgbazinye na ndị na-azụ bụrụ eziokwu.",
      },
    ],
  },
  reviews: {
    eyebrow: "Ahụrụ n'anya na Lagos",
    heading: "Ndị mgbazinye na ndị nwe ụlọ na-atụkwasị Hecta obi",
    statLabels: [
      "echekwara na ụgwọ onye nnọchi & ọkàiwu",
      "ụlọ a nyochara na Lagos",
      "ndị mgbazinye & ndị nwe ụlọ",
      "ọkwa ngwa ngwa nkezi",
    ],
    roles: {
      tenant: "Onye mgbazinye",
      landlord: "Onye nwe ụlọ",
      buyer: "Onye na-azụ",
    },
  },
  cta: {
    line1: "Chọta ụlọ gị na-esote",
    line2: "na-enweghị nsogbu",
    button: "Malite nchọ gị",
  },
  footer: {
    tagline:
      "Gbaa ma ọ bụ zụta ụlọ ị nwere ike ịtụkwasị obi — ụlọ a nyochara na Lagos, na-enweghị ụgwọ onye nnọchi na ọkàiwu.",
    newsletter: "Nweta ụlọ ọhụrụ na inbox gị",
    emailPlaceholder: "Tinye email gị",
    subscribe: "Debanye aha",
    getApp: "Nweta ngwa Hecta",
    scan: "Scan iji budata maka iOS & Android",
    explore: "Nyochaa",
    discover: "Chọpụta",
    links: {
      rentHome: "Gbaa ụlọ",
      buyHome: "Zụta ụlọ",
      listProperty: "Debe ụlọ gị",
      verifiedLandlords: "Ndị nwe ụlọ a nyochara",
      howItWorks: "Otú o si arụ ọrụ",
      whyHecta: "Gịnị kpatara Hecta",
      reviews: "Nyocha",
      getTheApp: "Nweta ngwa ahụ",
    },
  },
  waitlist: {
    floating: "Sonye na ndepụta",
    title: "Ọ bụrụ na ị kwado nke a, debanye aha",
    desc: "Sonye na ndepụta echere maka ohere mbụ na ụlọ a nyochara, enweghị ụgwọ, na Lagos.",
    firstName: "Aha mbụ",
    lastName: "Aha nna",
    email: "Adreesị email",
    location: "Ebe (dịka Lekki, Lagos)",
    budget: "Oke ego",
    timeline: "Oge ịbata",
    submit: "Debanye aha",
    timelineOptions: [
      "Ozugbo",
      "N'ime otu ọnwa",
      "Ọnwa 1 – 3",
      "Ọnwa 3 – 6",
      "Naanị na-eleba anya",
    ],
    successTitle: "Ị nọ na ndepụta!",
    successBody:
      "Daalụ maka ịkwado Hecta. Anyị ga-ezigara gị email ozugbo ohere mbụ mepere na mpaghara gị.",
    done: "Emechara",
  },
};

/* ── Hausa ───────────────────────────────────────────────── */
const ha: DeepPartial<Messages> = {
  nav: {
    rent: "Haya",
    buy: "Saya",
    list: "Lissafa gida",
    howItWorks: "Yadda yake aiki",
    getStarted: "Fara",
  },
  hero: {
    title: "Yi haya ko sayi gida da za ka amince da shi",
    browse: "Duba gidaje",
  },
  calc: {
    title: "Duba yawan da za ka tara",
    sub: "Babu kuɗin wakilci. Babu kuɗin lauya.",
    annualRent: "Hayar shekara",
    perYear: "kowace shekara",
    agency: "Kuɗin wakilci (25%)",
    legal: "Kuɗin lauya (10%)",
    youSave: "Ka tara",
    cta: "Duba gidaje marasa kuɗi",
  },
  doMore: {
    heading: "Yi ƙari da Hecta",
    browse: "Duba gidaje",
    search: {
      label: "Nema",
      desc: "dubban gidajen haya da na sayarwa a faɗin Legas, yadda kake so",
    },
    verify: {
      label: "Tabbatar",
      desc: "kowane mai gida da kowane gida tun farko, don kada ka ma'amala da wakilai ko zamba",
    },
    apply: {
      label: "Nemi",
      desc: "gidaje kuma ka tuntuɓi masu gida kai tsaye, duka a wuri ɗaya",
    },
    moveIn: {
      label: "Shiga",
      desc: "tare da yarjejeniyar haya da muke ƙirƙira — babu kuɗin lauya, babu wahala",
    },
  },
  earn: {
    line1: "Lissafa da hankali.",
    line2: "Yi haya da sauri.",
    body: "Zama mai gida da aka tabbatar kuma ka kai ga masu haya na gaske da aka tantance, ka sami daidaito nan take daga tafkin buƙatu, ka sarrafa komai daga WhatsApp, kuma ka ji daɗin matsayi na farko ga mambobi.",
    listCta: "Lissafa gidanka",
    seeHow: "Duba yadda yake aiki",
  },
  features: {
    learnMore: "Ƙara koyo",
    verified: {
      eyebrow: "Gidajen da aka tabbatar",
      line1: "Kowane gida,",
      line2: "an tabbatar da gaske",
      body: "Babu wakilai, babu jeri na ƙarya, babu mamaki. Muna tantance kowane mai gida kuma muna tabbatar da kowane gida da takardun mallaka na gaske kafin ya fito. Abin da ka gani shi ne abin da za ka yi haya.",
    },
    search: {
      eyebrow: "Bincike mai hankali",
      line1: "Sami gida daidai",
      line2: "da sauri",
      body: "Gaya mana ko kana son haya ko saya, zaɓi yankinka, kuma ka tace bisa farashi, ɗakuna, kayan ɗaki, matakin sabis, dabbobi, da ranar shiga. Wurin da ya dace yana nan da taɓawa kaɗan.",
    },
    trust: {
      eyebrow: "Aminci & tsaro",
      line1: "Yi haya ba tare da",
      line2: "wahala",
      body: "Tantance shaida da niyya yana sa masu haya da masu gida su zama na gaske, yayin da gano zamba da sauƙin bayar da rahoto ke kawar da zamba. Yi haya da mutanen da za ka dogara da su.",
    },
    agreements: {
      eyebrow: "Yarjejeniyar haya",
      line1: "Sa hannu kan yarjejeniyarka",
      line2: "cikin mintuna",
      body: "Bar kuɗin lauya. Hecta na ƙirƙirar yarjejeniyar hayarka daga gida da sharuɗɗan haya, tare da sassan da za ka iya gyara don biya, kulawa, da sanarwa. Fitar zuwa PDF kuma ka sa hannu ta dijital.",
    },
    demand: {
      eyebrow: "Tafkin buƙatu",
      line1: "Bari gida daidai",
      line2: "ya same ka",
      body: "Saka abin da kake nema da kasafin kuɗinka, masu gidan da suka dace za su zo wurinka. Yana juya binciken — masu haya da aka tabbatar suna samun sanarwa nan take idan gida da ya dace ya fito.",
    },
  },
  benefits: {
    eyebrow: "Me ya sa Hecta",
    heading: "Ko kana shiga ko kana ba da haya",
    sub: "An gina Hecta domin ɓangarorin biyu — adalci, sauri, babu kuɗi da wasanni.",
    seekerTag: "Ga masu neman gida",
    seekerTitle: "Sami gida, babu kuɗi",
    seekerCta: "Duba gidaje",
    landlordTag: "Ga masu gida",
    landlordTitle: "Ba da haya cikin kwanciyar hankali",
    landlordCta: "Lissafa gidanka",
    seekerItems: [
      "Gidajen da aka tabbatar kawai — babu wakilai, jeri na ƙarya, ko zamba",
      "Biya sifili na wakilci da lauya — tara har 35% kowane lokaci",
      "Tacewa mai hankali don farashi, ɗakuna, kayan ɗaki, matakin sabis da dabbobi",
      "Tuntuɓi masu gida da aka tabbatar kai tsaye, babu ɗan tsakiya",
      "Yarjejeniyar haya da ke shirye — sa hannu cikin mintuna, babu lauya",
      "Saka abin da kake so bari gidajen da suka dace su zo wurinka",
    ],
    landlordItems: [
      "Kai ga masu haya na gaske da suke shirye su shiga",
      "Sami daidaito nan take daga tafkin buƙatu",
      "Sarrafa jeri da hira kai tsaye daga WhatsApp",
      "Matsayi na farko ga gidajen da aka tabbatar",
      "Tantance shaida da niyya na kawar da masu ɓata lokaci",
      "Yarjejeniya da sa hannu ta dijital na rufe ciniki da sauri",
    ],
  },
  safe: {
    heading: "An gina shi kan aminci, ba sa'a ba",
    cards: [
      {
        title: "Masu gida da aka tabbatar",
        body: "Muna tantance kowane mai gida da NIN da shaidar mallaka kafin su iya lissafawa.",
      },
      {
        title: "Gidaje na gaske kawai",
        body: "Muna tabbatar da takardu kuma muna nuna kwafi, jeri na ƙarya, da farashin da ake tuhuma.",
      },
      {
        title: "Mutane masu muhimmanci kawai",
        body: "Binciken raye-raye da bayanan niyya na sa masu haya da masu saye su zama na gaske.",
      },
    ],
  },
  reviews: {
    eyebrow: "Ana so a faɗin Legas",
    heading: "Masu haya da masu gida sun amince da Hecta",
    statLabels: [
      "an tara a kuɗin wakilci & lauya",
      "gidajen da aka tabbatar a Legas",
      "masu haya & masu gida",
      "matsakaicin ƙimar manhaja",
    ],
    roles: { tenant: "Mai haya", landlord: "Mai gida", buyer: "Mai saye" },
  },
  cta: {
    line1: "Sami gidanka na gaba",
    line2: "ba tare da wahala ba",
    button: "Fara bincikenka",
  },
  footer: {
    tagline:
      "Yi haya ko sayi gida da za ka amince da shi — gidajen da aka tabbatar a Legas, babu kuɗin wakilci da lauya.",
    newsletter: "Sami sababbin gidaje a akwatinka",
    emailPlaceholder: "Shigar da imel ɗinka",
    subscribe: "Biyan kuɗi",
    getApp: "Sami manhajar Hecta",
    scan: "Skana don saukewa zuwa iOS & Android",
    explore: "Bincika",
    discover: "Gano",
    links: {
      rentHome: "Yi hayar gida",
      buyHome: "Sayi gida",
      listProperty: "Lissafa gidanka",
      verifiedLandlords: "Masu gida da aka tabbatar",
      howItWorks: "Yadda yake aiki",
      whyHecta: "Me ya sa Hecta",
      reviews: "Sharhi",
      getTheApp: "Sami manhajar",
    },
  },
  waitlist: {
    floating: "Shiga jerin jira",
    title: "Idan ka goyi bayan wannan, yi rajista",
    desc: "Shiga jerin jira don samun damar farko zuwa gidajen da aka tabbatar, marasa kuɗi, a Legas.",
    firstName: "Sunan farko",
    lastName: "Sunan mahaifi",
    email: "Adireshin imel",
    location: "Wuri (misali Lekki, Legas)",
    budget: "Iyakar kasafin kuɗi",
    timeline: "Lokacin shiga",
    submit: "Yi rajista",
    timelineOptions: [
      "Nan take",
      "Cikin wata ɗaya",
      "Wata 1 – 3",
      "Wata 3 – 6",
      "Ina kallo kawai",
    ],
    successTitle: "Kana cikin jerin!",
    successBody:
      "Na gode da goyon bayan Hecta. Za mu aiko maka imel nan take idan damar farko ta buɗe a yankinka.",
    done: "An gama",
  },
};

/* ── merge helpers ──────────────────────────────────────── */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepMerge<T>(base: T, override: unknown): T {
  if (!isPlainObject(base) || !isPlainObject(override)) {
    return override === undefined ? base : (override as T);
  }
  const result: Record<string, unknown> = { ...base };
  for (const key of Object.keys(override)) {
    result[key] = deepMerge(
      (base as Record<string, unknown>)[key],
      override[key],
    );
  }
  return result as T;
}

const dictionaries: Record<Lang, Messages> = {
  en,
  pcm: deepMerge(en, pcm),
  yo: deepMerge(en, yo),
  ig: deepMerge(en, ig),
  ha: deepMerge(en, ha),
};

/* ── context ────────────────────────────────────────────── */
type I18nValue = { lang: Lang; setLang: (lang: Lang) => void; t: Messages };

const I18nContext = createContext<I18nValue>({
  lang: "en",
  setLang: () => {},
  t: en,
});

const STORAGE_KEY = "hecta-lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (saved && saved in dictionaries) setLangState(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore storage failures (private mode, etc.)
    }
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t: dictionaries[lang] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
