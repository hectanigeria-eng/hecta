import type { GeoPoint } from "@/lib/types";

export interface AreaDef {
  slug: string;
  label: string;
}

export interface CityDef {
  slug: string;
  label: string;
  areas: AreaDef[];
}

export interface StateDef {
  slug: string;
  label: string;
  cities: CityDef[];
}

export const NIGERIA_LOCATIONS: StateDef[] = [
  {
    slug: "lagos",
    label: "Lagos",
    cities: [
      {
        slug: "eti-osa",
        label: "Eti-Osa",
        areas: [
          { slug: "lekki-phase-1", label: "Lekki Phase 1" },
          { slug: "ikate", label: "Ikate" },
          { slug: "vi", label: "Victoria Island" },
          { slug: "ikoyi", label: "Ikoyi" },
          { slug: "ajah", label: "Ajah" },
          { slug: "oniru", label: "Oniru" },
        ],
      },
      {
        slug: "ikeja",
        label: "Ikeja",
        areas: [
          { slug: "gra-ikeja", label: "Ikeja GRA" },
          { slug: "opebi", label: "Opebi" },
          { slug: "allen", label: "Allen Avenue" },
        ],
      },
      {
        slug: "yaba",
        label: "Yaba (Lagos Mainland)",
        areas: [
          { slug: "akoka", label: "Akoka" },
          { slug: "alagomeji", label: "Alagomeji" },
          { slug: "sabo", label: "Sabo" },
        ],
      },
      {
        slug: "surulere",
        label: "Surulere",
        areas: [
          { slug: "adeniran-ogunsanya", label: "Adeniran Ogunsanya" },
          { slug: "bode-thomas", label: "Bode Thomas" },
        ],
      },
      {
        slug: "kosofe",
        label: "Kosofe",
        areas: [
          { slug: "gbagada", label: "Gbagada" },
          { slug: "ogudu", label: "Ogudu GRA" },
        ],
      },
    ],
  },
  {
    slug: "abuja",
    label: "Abuja (FCT)",
    cities: [
      {
        slug: "amac",
        label: "AMAC",
        areas: [
          { slug: "wuse-2", label: "Wuse 2" },
          { slug: "maitama", label: "Maitama" },
          { slug: "gwarinpa", label: "Gwarinpa" },
          { slug: "jabi", label: "Jabi" },
        ],
      },
    ],
  },
];

// Approximate real-world centroid per area slug, used as the base point for
// each listing's `geoPoint` (jittered per-listing so pins don't stack).
export const AREA_COORDS: Record<string, GeoPoint> = {
  // Lagos — Eti-Osa
  "lekki-phase-1": { lat: 6.4404, lng: 3.4698 },
  ikate: { lat: 6.443, lng: 3.52 },
  vi: { lat: 6.4281, lng: 3.4219 },
  ikoyi: { lat: 6.45, lng: 3.4333 },
  ajah: { lat: 6.4698, lng: 3.5852 },
  oniru: { lat: 6.435, lng: 3.445 },
  // Lagos — Ikeja
  "gra-ikeja": { lat: 6.5833, lng: 3.35 },
  opebi: { lat: 6.59, lng: 3.36 },
  allen: { lat: 6.6018, lng: 3.3515 },
  // Lagos — Yaba
  akoka: { lat: 6.5167, lng: 3.3833 },
  alagomeji: { lat: 6.5027, lng: 3.3819 },
  sabo: { lat: 6.51, lng: 3.38 },
  // Lagos — Surulere
  "adeniran-ogunsanya": { lat: 6.4933, lng: 3.355 },
  "bode-thomas": { lat: 6.498, lng: 3.36 },
  // Lagos — Kosofe
  gbagada: { lat: 6.558, lng: 3.389 },
  ogudu: { lat: 6.562, lng: 3.396 },
  // Abuja — AMAC
  "wuse-2": { lat: 9.0765, lng: 7.477 },
  maitama: { lat: 9.09, lng: 7.495 },
  gwarinpa: { lat: 9.11, lng: 7.41 },
  jabi: { lat: 9.0765, lng: 7.423 },
};

export function stateBySlug(slug: string): StateDef | undefined {
  return NIGERIA_LOCATIONS.find((state) => state.slug === slug);
}

export function cityBySlug(state: string, city: string): CityDef | undefined {
  return stateBySlug(state)?.cities.find((c) => c.slug === city);
}

export function locationLabel(
  state: string,
  city: string,
  area: string,
): string {
  const cityDef = cityBySlug(state, city);
  const areaDef = cityDef?.areas.find((a) => a.slug === area);
  if (!cityDef || !areaDef) {
    return "";
  }
  return `${areaDef.label}, ${cityDef.label}`;
}
