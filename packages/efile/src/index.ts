import type { EfileMode, FilingPackage, FilingResult } from "./types.js";
import { submitSandboxFiling } from "./sandbox-filer.js";

export interface FilingCredentials {
  pacerUsername?: string;
  pacerPassword?: string;
  attorneyBarNumber?: string;
}

export interface SubmitToCmEcfOptions {
  mode?: EfileMode;
  credentials?: FilingCredentials;
  /** Playwright filer injected by efile-bridge in live mode */
  liveFiler?: (pkg: FilingPackage, credentials: FilingCredentials) => Promise<FilingResult>;
}

function resolveMode(explicit?: EfileMode): EfileMode {
  if (explicit) return explicit;
  const envMode = process.env.EFILE_MODE;
  if (envMode === "live") return "live";
  return "sandbox";
}

/** Route filing to sandbox or live Playwright bridge */
export async function submitToCmEcf(
  pkg: FilingPackage,
  options: SubmitToCmEcfOptions = {}
): Promise<FilingResult> {
  const mode = resolveMode(options.mode);

  if (mode === "sandbox") {
    return submitSandboxFiling(pkg);
  }

  if (!options.credentials?.pacerUsername || !options.credentials?.pacerPassword) {
    throw new Error(
      "Live CM/ECF filing requires PACER credentials (PACER_USERNAME, PACER_PASSWORD)"
    );
  }

  if (!options.liveFiler) {
    throw new Error(
      "Live filing requires efile-bridge Playwright runner — set EFILE_BRIDGE_URL or use sandbox mode"
    );
  }

  return options.liveFiler(pkg, options.credentials);
}

export {
  buildFilingPackage,
  validatePackageForFiling,
} from "./package-builder.js";
export {
  submitSandboxFiling,
  createFilingJob,
  completeFilingJob,
} from "./sandbox-filer.js";
export {
  getDistrictConfig,
  eventCodeForForm,
  CM_ECF_EVENT_CODES,
  CACB_CONFIG,
  DISTRICT_CONFIGS,
} from "./cacb-nextgen.js";
export type {
  BuildPackageInput,
  EfileChapter,
  EfileDistrict,
  EfileMode,
  FilingDocument,
  FilingJob,
  FilingPackage,
  FilingResult,
  FilingStatus,
} from "./types.js";
export {
  FilingDocumentSchema,
  FilingPackageSchema,
  FilingResultSchema,
  FilingJobSchema,
} from "./types.js";
