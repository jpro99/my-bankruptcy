import type { FilingCredentials, FilingPackage, FilingResult } from "@chapterai/efile";
import { submitToCmEcf } from "@chapterai/efile";
import { isPlaywrightAvailable, runPlaywrightFiling } from "./playwright-filer.js";

export interface BridgeSubmitOptions {
  mode?: "sandbox" | "live";
  credentials?: FilingCredentials;
  headless?: boolean;
}

/** Main entry — used by API and worker */
export async function submitViaBridge(
  pkg: FilingPackage,
  options: BridgeSubmitOptions = {}
): Promise<FilingResult> {
  const mode = options.mode ?? (process.env.EFILE_MODE === "live" ? "live" : "sandbox");

  if (mode === "live") {
    const credentials: FilingCredentials = options.credentials ?? {
      pacerUsername: process.env.PACER_USERNAME,
      pacerPassword: process.env.PACER_PASSWORD,
      attorneyBarNumber: process.env.ATTORNEY_BAR_NUMBER,
    };

    return submitToCmEcf(pkg, {
      mode: "live",
      credentials,
      liveFiler: (p, creds) =>
        runPlaywrightFiling(p, creds, { headless: options.headless }),
    });
  }

  return submitToCmEcf(pkg, { mode: "sandbox" });
}

export async function getBridgeStatus(): Promise<{
  mode: string;
  playwrightAvailable: boolean;
  pacerConfigured: boolean;
}> {
  return {
    mode: process.env.EFILE_MODE === "live" ? "live" : "sandbox",
    playwrightAvailable: await isPlaywrightAvailable(),
    pacerConfigured: !!(process.env.PACER_USERNAME && process.env.PACER_PASSWORD),
  };
}

export { runPlaywrightFiling, isPlaywrightAvailable } from "./playwright-filer.js";
