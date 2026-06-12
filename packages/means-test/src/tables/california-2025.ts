/**
 * California State Median Family Income by Household Size
 * Source: U.S. Trustee Program, Census Bureau data
 * Effective: April 1, 2025 (11 U.S.C. § 101(39A))
 */
export const CA_MEDIAN_INCOME_2025: Record<number, string> = {
  1: "71957",
  2: "93175",
  3: "103090",
  4: "118886",
  5: "130686",
  6: "142486",
  7: "154286",
  8: "166086",
};

export function getCaliforniaMedianIncome(householdSize: number): string {
  const size = Math.min(Math.max(householdSize, 1), 8);
  const base = CA_MEDIAN_INCOME_2025[size]!;
  if (householdSize > 8) {
    const extra = householdSize - 8;
    const perPerson = "11800"; // approximate add-on per additional person
    const baseDec = parseFloat(base);
    const addon = extra * parseFloat(perPerson);
    return (baseDec + addon).toFixed(0);
  }
  return base;
}

/** IRS National Standards — Allowance for Food, Clothing, etc. (2025) */
export const IRS_NATIONAL_STANDARDS_2025 = {
  food: { 1: "431", 2: "764", 3: "911", 4: "1058" },
  housekeeping: { 1: "41", 2: "76", 3: "89", 4: "102" },
  apparel: { 1: "88", 2: "157", 3: "187", 4: "217" },
  personalCare: { 1: "43", 2: "76", 3: "91", 4: "106" },
  misc: { 1: "32", 2: "57", 3: "68", 4: "79" },
} as const;

export function getNationalStandardAllowance(
  category: keyof typeof IRS_NATIONAL_STANDARDS_2025,
  householdSize: number
): string {
  const size = Math.min(Math.max(householdSize, 1), 4) as 1 | 2 | 3 | 4;
  return IRS_NATIONAL_STANDARDS_2025[category][size];
}

/** IRS Local Standards — Housing and Utilities, Fresno CA (CACB representative) */
export const IRS_LOCAL_HOUSING_FRESNO_2025 = {
  mortgageOrRent: "1200",
  utilities: "389",
  operating: "234",
};

/** IRS Local Standards — Transportation (California, 2025) */
export const IRS_LOCAL_TRANSPORTATION_CA_2025 = {
  ownershipSingleCar: "588",
  operatingSingleCar: "256",
  publicTransportation: "215",
};

/** IRS Local Standards — Healthcare (out-of-pocket, per person under 65) */
export const IRS_HEALTHCARE_UNDER_65 = "79";
export const IRS_HEALTHCARE_65_AND_OVER = "158";
