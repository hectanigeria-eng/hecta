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
