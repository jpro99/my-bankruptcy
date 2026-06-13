import type { EfileDistrict } from "./types.js";

export interface DistrictConfig {
  district: EfileDistrict;
  courtName: string;
  /** NextGen CM/ECF base URL (live) */
  cmEcfBaseUrl: string;
  /** PACER login URL */
  pacerLoginUrl: string;
  /** Bankruptcy case opening event */
  petitionEventCode: string;
  localFormPrefix: string;
}

export const CACB_CONFIG: DistrictConfig = {
  district: "CACB",
  courtName: "U.S. Bankruptcy Court — Central District of California",
  cmEcfBaseUrl: "https://ecf.cacb.uscourts.gov",
  pacerLoginUrl: "https://pacer.login.uscourts.gov/csologin/login.jsf",
  petitionEventCode: "Petition",
  localFormPrefix: "CACB",
};

export const DISTRICT_CONFIGS: Record<EfileDistrict, DistrictConfig> = {
  CACB: CACB_CONFIG,
  CAEB: {
    district: "CAEB",
    courtName: "U.S. Bankruptcy Court — Eastern District of California",
    cmEcfBaseUrl: "https://ecf.caeb.uscourts.gov",
    pacerLoginUrl: "https://pacer.login.uscourts.gov/csologin/login.jsf",
    petitionEventCode: "Petition",
    localFormPrefix: "CAEB",
  },
  CANB: {
    district: "CANB",
    courtName: "U.S. Bankruptcy Court — Northern District of California",
    cmEcfBaseUrl: "https://ecf.canb.uscourts.gov",
    pacerLoginUrl: "https://pacer.login.uscourts.gov/csologin/login.jsf",
    petitionEventCode: "Petition",
    localFormPrefix: "CANB",
  },
  CASB: {
    district: "CASB",
    courtName: "U.S. Bankruptcy Court — Southern District of California",
    cmEcfBaseUrl: "https://ecf.casb.uscourts.gov",
    pacerLoginUrl: "https://pacer.login.uscourts.gov/csologin/login.jsf",
    petitionEventCode: "Petition",
    localFormPrefix: "CASB",
  },
};

/** NextGen CM/ECF event codes for common bankruptcy documents */
export const CM_ECF_EVENT_CODES: Record<string, string> = {
  "101": "Petition",
  "106A/B": "Schedules AB",
  "106C": "Schedule C",
  "106D": "Schedule D",
  "106E/F": "Schedules EF",
  "106G": "Schedule G",
  "106H": "Schedule H",
  "106I": "Schedule I",
  "106J": "Schedule J",
  "107": "SOFA",
  "122A-1": "122A-1",
  "122A-2": "122A-2",
  "122C-1": "122C-1",
  "122C-2": "122C-2",
  "3015-1.01": "Chapter 13 Plan",
  "3015-1.7": "RARA",
  "MML": "Master Mailing List",
  "341": "341 Meeting Notice",
  "cert-counsel": "Credit Counseling Certificate",
  "cert-education": "Debtor Education Certificate",
};

export function getDistrictConfig(district: EfileDistrict): DistrictConfig {
  return DISTRICT_CONFIGS[district];
}

export function eventCodeForForm(formId: string): string {
  return CM_ECF_EVENT_CODES[formId] ?? `Form ${formId}`;
}
