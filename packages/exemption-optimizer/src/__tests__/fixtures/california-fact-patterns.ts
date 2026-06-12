/**
 * Anonymized California exemption fact patterns.
 */

import type { AssetItem } from "../../optimizer.js";

/** Fact Pattern A — Garcia (Sacramento homeowner)
 * Primary residence with significant equity, modest vehicle, retirement account.
 * System 2 homestead floor/cap should outperform System 1 for high-equity home.
 */
export const FACT_PATTERN_GARCIA: {
  id: string;
  description: string;
  assets: AssetItem[];
  expected: {
    recommendedSystem: "system1" | "system2";
    system2HomesteadExemptMin: string;
  };
} = {
  id: "garcia-2025-cacb",
  description:
    "Married homeowner, Sacramento CA, $485,000 home equity, $12,000 vehicle, $45,000 401(k)",
  assets: [
    {
      id: "home",
      category: "homestead",
      description: "Primary residence — 2847 Riverside Blvd, Sacramento CA",
      currentValue: "685000.00",
      equity: "485000.00",
    },
    {
      id: "vehicle",
      category: "motor_vehicle",
      description: "2019 Toyota Camry",
      currentValue: "12000.00",
    },
    {
      id: "household",
      category: "household_goods",
      description: "Household furnishings and appliances",
      currentValue: "8500.00",
    },
    {
      id: "retirement",
      category: "retirement",
      description: "Employer 401(k) — fully exempt",
      currentValue: "45000.00",
    },
    {
      id: "bank",
      category: "bank_account",
      description: "Checking account — Wells Fargo",
      currentValue: "3200.00",
    },
  ],
  expected: {
    recommendedSystem: "system2",
    system2HomesteadExemptMin: "361076.00",
  },
};

/** Fact Pattern B — Nguyen (renter, Fresno)
 * No real property, vehicle near exemption limit, moderate bank balance.
 * System 2 higher vehicle exemption wins overall (no tools of trade).
 */
export const FACT_PATTERN_NGUYEN: {
  id: string;
  description: string;
  assets: AssetItem[];
  expected: {
    recommendedSystem: "system1" | "system2";
    totalNonexemptSystem2Max: string;
  };
} = {
  id: "nguyen-2025-cacb",
  description: "Single renter, Fresno CA, $9,500 vehicle, $6,200 bank, $4,800 household goods",
  assets: [
    {
      id: "vehicle",
      category: "motor_vehicle",
      description: "2017 Honda Civic",
      currentValue: "9500.00",
    },
    {
      id: "household",
      category: "household_goods",
      description: "Household goods and furniture",
      currentValue: "4800.00",
    },
    {
      id: "bank",
      category: "bank_account",
      description: "Savings account — Bank of America",
      currentValue: "6200.00",
    },
  ],
  expected: {
    recommendedSystem: "system2",
    totalNonexemptSystem2Max: "9000.00",
  },
};
