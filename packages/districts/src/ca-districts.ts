import type { CaliforniaDistrict, DistrictDivision, DistrictProfile } from "./types.js";

const CACB_DIVISIONS: DistrictDivision[] = [
  { id: "la", name: "Los Angeles", courthouse: "Edward R. Roybal Federal Building" },
  { id: "riverside", name: "Riverside", courthouse: "Riverside Federal Courthouse" },
  { id: "santa-ana", name: "Santa Ana", courthouse: "Ronald Reagan Federal Building" },
  { id: "san-fernando", name: "San Fernando Valley", courthouse: "Oliver Wendell Holmes Jr. Courthouse" },
  { id: "santa-barbara", name: "Santa Barbara", courthouse: "Santa Barbara Courthouse" },
];

const CAEB_DIVISIONS: DistrictDivision[] = [
  { id: "sacramento", name: "Sacramento", courthouse: "Robert T. Matsui U.S. Courthouse" },
  { id: "fresno", name: "Fresno", courthouse: "Robert E. Coyle U.S. Courthouse" },
  { id: "bakersfield", name: "Bakersfield", courthouse: "Bakersfield Division" },
];

const CANB_DIVISIONS: DistrictDivision[] = [
  { id: "oakland", name: "Oakland", courthouse: "Ronald V. Dellums Federal Building" },
  { id: "san-francisco", name: "San Francisco", courthouse: "Phillip Burton Federal Building" },
  { id: "san-jose", name: "San Jose", courthouse: "Robert F. Peckham Federal Building" },
];

const CASB_DIVISIONS: DistrictDivision[] = [
  { id: "san-diego", name: "San Diego", courthouse: "Edward J. Schwartz U.S. Courthouse" },
  { id: "imperial", name: "Imperial", courthouse: "El Centro Division" },
];

export const CALIFORNIA_DISTRICTS: Record<CaliforniaDistrict, DistrictProfile> = {
  CACB: {
    code: "CACB",
    name: "Central District of California",
    shortName: "CACB",
    courtName: "U.S. Bankruptcy Court — Central District of California",
    cmEcfBaseUrl: "https://ecf.cacb.uscourts.gov",
    divisions: CACB_DIVISIONS,
    localFormsRequired: ["3015-1.7", "MML", "341", "cert-counsel"],
    primaryCounties: [
      "Los Angeles",
      "Orange",
      "Ventura",
      "Santa Barbara",
      "San Luis Obispo",
      "Kern",
      "Riverside",
      "San Bernardino",
    ],
  },
  CAEB: {
    code: "CAEB",
    name: "Eastern District of California",
    shortName: "CAEB",
    courtName: "U.S. Bankruptcy Court — Eastern District of California",
    cmEcfBaseUrl: "https://ecf.caeb.uscourts.gov",
    divisions: CAEB_DIVISIONS,
    localFormsRequired: ["cert-counsel", "MML"],
    primaryCounties: [
      "Sacramento",
      "Fresno",
      "Kern",
      "Tulare",
      "Stanislaus",
      "Merced",
      "Yolo",
      "Placer",
    ],
  },
  CANB: {
    code: "CANB",
    name: "Northern District of California",
    shortName: "CANB",
    courtName: "U.S. Bankruptcy Court — Northern District of California",
    cmEcfBaseUrl: "https://ecf.canb.uscourts.gov",
    divisions: CANB_DIVISIONS,
    localFormsRequired: ["cert-counsel", "MML", "local-rules-ack"],
    primaryCounties: [
      "San Francisco",
      "Alameda",
      "Santa Clara",
      "San Mateo",
      "Contra Costa",
      "Marin",
      "Sonoma",
      "Napa",
    ],
  },
  CASB: {
    code: "CASB",
    name: "Southern District of California",
    shortName: "CASB",
    courtName: "U.S. Bankruptcy Court — Southern District of California",
    cmEcfBaseUrl: "https://ecf.casb.uscourts.gov",
    divisions: CASB_DIVISIONS,
    localFormsRequired: ["cert-counsel", "MML", "SD-local-cover"],
    primaryCounties: ["San Diego", "Imperial"],
  },
};

/** County name (case-insensitive) → bankruptcy district */
const COUNTY_TO_DISTRICT: Record<string, CaliforniaDistrict> = {};

for (const [code, profile] of Object.entries(CALIFORNIA_DISTRICTS) as [
  CaliforniaDistrict,
  DistrictProfile,
][]) {
  for (const county of profile.primaryCounties) {
    COUNTY_TO_DISTRICT[county.toLowerCase()] = code;
  }
}

/** Kern spans CACB and CAEB — default CACB unless attorney overrides */
COUNTY_TO_DISTRICT["kern"] = "CACB";

export function getDistrictProfile(code: CaliforniaDistrict): DistrictProfile {
  return CALIFORNIA_DISTRICTS[code];
}

export function listCaliforniaDistricts(): DistrictProfile[] {
  return Object.values(CALIFORNIA_DISTRICTS);
}

export function getDistrictForCounty(county: string): CaliforniaDistrict {
  const normalized = county.trim().toLowerCase();
  return COUNTY_TO_DISTRICT[normalized] ?? "CACB";
}

export function getDefaultDivision(
  district: CaliforniaDistrict,
  county: string
): DistrictDivision {
  const profile = getDistrictProfile(district);
  const countyLower = county.toLowerCase();

  const byCounty: Partial<Record<CaliforniaDistrict, Record<string, string>>> = {
    CACB: {
      "los angeles": "la",
      orange: "santa-ana",
      ventura: "la",
      riverside: "riverside",
      "san bernardino": "riverside",
    },
    CAEB: {
      sacramento: "sacramento",
      fresno: "fresno",
      kern: "bakersfield",
    },
    CANB: {
      "san francisco": "san-francisco",
      alameda: "oakland",
      "santa clara": "san-jose",
    },
    CASB: {
      "san diego": "san-diego",
      imperial: "imperial",
    },
  };

  const divisionId = byCounty[district]?.[countyLower];
  if (divisionId) {
    const found = profile.divisions.find((d) => d.id === divisionId);
    if (found) return found;
  }

  return profile.divisions[0]!;
}
