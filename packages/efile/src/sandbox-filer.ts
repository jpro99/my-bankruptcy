import { randomUUID } from "node:crypto";
import type { EfileMode, FilingJob, FilingPackage, FilingResult } from "./types.js";
import { validatePackageForFiling } from "./package-builder.js";
import { getDistrictConfig } from "./cacb-nextgen.js";

export interface SubmitFilingOptions {
  mode?: EfileMode;
  /** Simulated network delay ms (sandbox only) */
  delayMs?: number;
}

function generateCaseNumber(district: string, chapter: "7" | "13"): string {
  const year = new Date().getFullYear().toString().slice(-2);
  const seq = String(Math.floor(Math.random() * 90000) + 10000);
  const division = district === "CACB" ? "2" : "1";
  return `${division}:${year}-bk-${seq}${chapter === "13" ? "-13" : ""}`;
}

function generateReceiptNumber(): string {
  return `CACB-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

/** Sandbox CM/ECF submission — no PACER credentials required */
export async function submitSandboxFiling(
  pkg: FilingPackage,
  options: SubmitFilingOptions = {}
): Promise<FilingResult> {
  const validation = validatePackageForFiling(pkg);
  if (!validation.valid) {
    throw new Error(`Filing package invalid: ${validation.errors.join("; ")}`);
  }

  const delayMs = options.delayMs ?? 800;
  await new Promise((resolve) => setTimeout(resolve, delayMs));

  const config = getDistrictConfig(pkg.district);
  const jobId = randomUUID();
  const caseNumber = generateCaseNumber(pkg.district, pkg.chapter);
  const receiptNumber = generateReceiptNumber();
  const filedAt = new Date().toISOString();

  return {
    jobId,
    matterId: pkg.matterId,
    status: "filed",
    mode: "sandbox",
    caseNumber,
    filedAt,
    receiptNumber,
    receiptUrl: `/api/efile/receipt/${jobId}`,
    documentsFiled: pkg.documents.length,
    district: pkg.district,
    message: `Petition package accepted by ${config.courtName} (sandbox CM/ECF)`,
    pacerFeeCents: 0,
  };
}

export function createFilingJob(
  pkg: FilingPackage,
  mode: EfileMode,
  status: FilingJob["status"] = "pending"
): FilingJob {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    matterId: pkg.matterId,
    status,
    mode,
    package: pkg,
    createdAt: now,
    updatedAt: now,
  };
}

export function completeFilingJob(job: FilingJob, result: FilingResult): FilingJob {
  return {
    ...job,
    status: "filed",
    result,
    updatedAt: new Date().toISOString(),
  };
}
