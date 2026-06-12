/**
 * California exemption amounts — 2025/2026 indexed values
 * CCP §704 (System 1) and CCP §703.140(b) (System 2 / federal bankruptcy exemptions)
 */

import Decimal from "decimal.js";
import { d, toMoney, sum, min, max } from "./decimal.js";

/** Homestead — System 1 (CCP §704.730) */
export const SYSTEM1_HOMESTEAD = "339000.00"; // 2025 indexed; floor $361,076 for newer indexing

/** Homestead — System 2 (CCP §703.140(b)(1), 11 U.S.C. §522(d)(1) adjusted) */
export const SYSTEM2_HOMESTEAD_FLOOR = "361076.00";
export const SYSTEM2_HOMESTEAD_CAP = "722507.00";

/** System 1 — CCP §704 key exemptions (2025) */
export const SYSTEM1_EXEMPTIONS = {
  homestead: SYSTEM1_HOMESTEAD,
  householdGoods: "7750.00", // §704.020
  clothing: "1750.00", // §704.040
  jewelry: "8750.00", // §704.030
  motorVehicle: "3325.00", // §704.010
  toolsOfTrade: "7750.00", // §704.060
  wildcard: "1400.00", // §704.060(a)(5) + unused residential
  bankDeposit: "1750.00", // §704.080
  lifeInsurance: "13700.00", // §704.100
  retirement: "unlimited", // §704.115
  publicBenefits: "unlimited", // §704.080
} as const;

/** System 2 — CCP §703.140(b) / 11 U.S.C. §522(d) (2025 adjusted) */
export const SYSTEM2_EXEMPTIONS = {
  homesteadFloor: SYSTEM2_HOMESTEAD_FLOOR,
  homesteadCap: SYSTEM2_HOMESTEAD_CAP,
  householdGoods: "8250.00", // §522(d)(3)
  clothing: "unlimited", // reasonable need
  jewelry: "2075.00", // §522(d)(4)
  motorVehicle: "5075.00", // §522(d)(2)
  toolsOfTrade: "3175.00", // §522(d)(6)
  wildcard: "1700.00", // §522(d)(5) + unused homestead
  wildcardPlusHomestead: "5075.00", // up to $5075 of unused homestead
  retirement: "unlimited", // §522(d)(12)
  publicBenefits: "unlimited",
} as const;

export type ExemptionSystem = "system1" | "system2";

export interface AssetItem {
  id: string;
  category:
    | "homestead"
    | "motor_vehicle"
    | "household_goods"
    | "jewelry"
    | "tools_of_trade"
    | "bank_account"
    | "retirement"
    | "life_insurance"
    | "other";
  description: string;
  currentValue: string;
  /** For homestead: equity after mortgage */
  equity?: string;
}

export interface ExemptionClaimResult {
  assetId: string;
  category: AssetItem["category"];
  description: string;
  currentValue: string;
  exemptAmount: string;
  nonexemptAmount: string;
  statute: string;
}

export interface SystemSimulationResult {
  system: ExemptionSystem;
  claims: ExemptionClaimResult[];
  totalExempt: string;
  totalNonexempt: string;
  totalAssetValue: string;
}

export interface ExemptionOptimizerResult {
  recommendedSystem: ExemptionSystem;
  system1: SystemSimulationResult;
  system2: SystemSimulationResult;
  savingsAdvantage: string;
  rationale: string;
}

function getHomesteadExemption(
  system: ExemptionSystem,
  equity: string,
  options?: { over65OrDisabled?: boolean }
): { exempt: Decimal; statute: string } {
  const eq = d(equity);
  if (system === "system1") {
    const cap = d(SYSTEM1_EXEMPTIONS.homestead);
    return { exempt: min(eq, cap), statute: "CCP §704.730" };
  }
  const limit = options?.over65OrDisabled
    ? d(SYSTEM2_HOMESTEAD_CAP)
    : d(SYSTEM2_HOMESTEAD_FLOOR);
  return {
    exempt: min(eq, limit),
    statute: "CCP §703.140(b)(1)",
  };
}

function getCategoryExemption(
  system: ExemptionSystem,
  category: AssetItem["category"],
  value: Decimal
): { exempt: Decimal; statute: string } {
  if (category === "homestead") {
    return { exempt: d(0), statute: "" };
  }

  if (category === "retirement" || category === "life_insurance") {
    return {
      exempt: value,
      statute: system === "system1" ? "CCP §704.115" : "11 U.S.C. §522(d)(12)",
    };
  }

  const limits: Record<ExemptionSystem, Partial<Record<AssetItem["category"], string>>> = {
    system1: {
      motor_vehicle: SYSTEM1_EXEMPTIONS.motorVehicle,
      household_goods: SYSTEM1_EXEMPTIONS.householdGoods,
      jewelry: SYSTEM1_EXEMPTIONS.jewelry,
      tools_of_trade: SYSTEM1_EXEMPTIONS.toolsOfTrade,
      bank_account: SYSTEM1_EXEMPTIONS.bankDeposit,
    },
    system2: {
      motor_vehicle: SYSTEM2_EXEMPTIONS.motorVehicle,
      household_goods: SYSTEM2_EXEMPTIONS.householdGoods,
      jewelry: SYSTEM2_EXEMPTIONS.jewelry,
      tools_of_trade: SYSTEM2_EXEMPTIONS.toolsOfTrade,
      bank_account: SYSTEM2_EXEMPTIONS.wildcard,
    },
  };

  const limitStr = limits[system][category];
  if (!limitStr) {
    const wildcard =
      system === "system1" ? SYSTEM1_EXEMPTIONS.wildcard : SYSTEM2_EXEMPTIONS.wildcard;
    return { exempt: min(value, d(wildcard)), statute: system === "system1" ? "CCP §704.060" : "11 U.S.C. §522(d)(5)" };
  }

  const cap = d(limitStr);
  const statuteMap: Record<AssetItem["category"], Record<ExemptionSystem, string>> = {
    motor_vehicle: { system1: "CCP §704.010", system2: "11 U.S.C. §522(d)(2)" },
    household_goods: { system1: "CCP §704.020", system2: "11 U.S.C. §522(d)(3)" },
    jewelry: { system1: "CCP §704.030", system2: "11 U.S.C. §522(d)(4)" },
    tools_of_trade: { system1: "CCP §704.060", system2: "11 U.S.C. §522(d)(6)" },
    bank_account: { system1: "CCP §704.080", system2: "11 U.S.C. §522(d)(5)" },
    homestead: { system1: "CCP §704.730", system2: "CCP §703.140(b)(1)" },
    retirement: { system1: "CCP §704.115", system2: "11 U.S.C. §522(d)(12)" },
    life_insurance: { system1: "CCP §704.100", system2: "11 U.S.C. §522(d)(8)" },
    other: { system1: "CCP §704.060", system2: "11 U.S.C. §522(d)(5)" },
  };

  return { exempt: min(value, cap), statute: statuteMap[category][system] };
}

export function simulateExemptionSystem(
  system: ExemptionSystem,
  assets: AssetItem[]
): SystemSimulationResult {
  const claims: ExemptionClaimResult[] = [];
  let totalExempt = d(0);
  let totalNonexempt = d(0);
  let totalValue = d(0);

  for (const asset of assets) {
    const value = d(asset.currentValue);
    totalValue = totalValue.plus(value);

    let exempt: Decimal;
    let statute: string;
    let taxableBase: Decimal;

    if (asset.category === "homestead") {
      taxableBase = d(asset.equity ?? asset.currentValue);
      const result = getHomesteadExemption(system, toMoney(taxableBase));
      exempt = result.exempt;
      statute = result.statute;
    } else {
      taxableBase = value;
      const result = getCategoryExemption(system, asset.category, value);
      exempt = result.exempt;
      statute = result.statute;
    }

    const nonexempt = max(taxableBase.minus(exempt), "0");
    totalExempt = totalExempt.plus(exempt);
    totalNonexempt = totalNonexempt.plus(nonexempt);

    claims.push({
      assetId: asset.id,
      category: asset.category,
      description: asset.description,
      currentValue: toMoney(value),
      exemptAmount: toMoney(exempt),
      nonexemptAmount: toMoney(nonexempt),
      statute,
    });
  }

  return {
    system,
    claims,
    totalExempt: toMoney(totalExempt),
    totalNonexempt: toMoney(totalNonexempt),
    totalAssetValue: toMoney(totalValue),
  };
}

export function optimizeExemptions(assets: AssetItem[]): ExemptionOptimizerResult {
  const system1 = simulateExemptionSystem("system1", assets);
  const system2 = simulateExemptionSystem("system2", assets);

  const nonexempt1 = d(system1.totalNonexempt);
  const nonexempt2 = d(system2.totalNonexempt);

  const recommendedSystem: ExemptionSystem = nonexempt2.lte(nonexempt1) ? "system2" : "system1";
  const savings = nonexempt1.minus(nonexempt2).abs();

  const rationale =
    recommendedSystem === "system2"
      ? `System 2 (CCP §703.140(b)) protects $${system2.totalExempt} in assets, ` +
        `leaving $${system2.totalNonexempt} non-exempt vs $${system1.totalNonexempt} under System 1. ` +
        `System 2 saves $${toMoney(savings)} in exposed assets.`
      : `System 1 (CCP §704) protects $${system1.totalExempt} in assets, ` +
        `leaving $${system1.totalNonexempt} non-exempt vs $${system2.totalNonexempt} under System 2. ` +
        `System 1 saves $${toMoney(savings)} in exposed assets.`;

  return {
    recommendedSystem,
    system1,
    system2,
    savingsAdvantage: toMoney(savings),
    rationale,
  };
}
