import { z } from "zod";

export const CaliforniaDistrictSchema = z.enum(["CACB", "CAEB", "CANB", "CASB"]);
export type CaliforniaDistrict = z.infer<typeof CaliforniaDistrictSchema>;

export interface DistrictDivision {
  id: string;
  name: string;
  courthouse: string;
}

export interface DistrictProfile {
  code: CaliforniaDistrict;
  name: string;
  shortName: string;
  courtName: string;
  cmEcfBaseUrl: string;
  divisions: DistrictDivision[];
  /** CACB-style local form IDs required at filing */
  localFormsRequired: string[];
  /** Primary counties — used for county → district routing */
  primaryCounties: string[];
}

export interface DistrictPreflightRule {
  ruleId: string;
  category: string;
  severity: "error" | "warning" | "info";
  message: string;
  formReference?: string;
  /** Returns true if rule passes */
  check: (ctx: DistrictPreflightContext) => boolean;
}

export interface DistrictPreflightContext {
  district: CaliforniaDistrict;
  divisionId?: string;
  county: string;
  chapter: "7" | "13";
  localFormsComplete: boolean;
  hasCertificateOfCreditCounseling: boolean;
  hasRara: boolean;
}
