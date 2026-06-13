import { z } from "zod";

export const EfileDistrictSchema = z.enum(["CACB", "CAEB", "CANB", "CASB"]);
export type EfileDistrict = z.infer<typeof EfileDistrictSchema>;

export const EfileChapterSchema = z.enum(["7", "13"]);
export type EfileChapter = z.infer<typeof EfileChapterSchema>;

export const EfileModeSchema = z.enum(["sandbox", "live"]);
export type EfileMode = z.infer<typeof EfileModeSchema>;

export const FilingDocumentSchema = z.object({
  formId: z.string(),
  label: z.string(),
  fileName: z.string(),
  mimeType: z.literal("application/pdf"),
  sizeBytes: z.number().int().positive(),
  sha256: z.string().length(64),
  /** NextGen CM/ECF event code */
  eventCode: z.string(),
  /** Official vs local form */
  category: z.enum(["official", "local", "plan", "certificate"]),
});

export type FilingDocument = z.infer<typeof FilingDocumentSchema>;

export const FilingPackageSchema = z.object({
  matterId: z.string(),
  firmId: z.string(),
  district: EfileDistrictSchema,
  chapter: EfileChapterSchema,
  debtorDisplayName: z.string(),
  attorneyName: z.string(),
  documents: z.array(FilingDocumentSchema).min(1),
  metadata: z.record(z.unknown()).optional(),
});

export type FilingPackage = z.infer<typeof FilingPackageSchema>;

export const FilingStatusSchema = z.enum([
  "pending",
  "assembling",
  "submitting",
  "filed",
  "rejected",
  "error",
]);

export type FilingStatus = z.infer<typeof FilingStatusSchema>;

export const FilingResultSchema = z.object({
  jobId: z.string(),
  matterId: z.string(),
  status: z.literal("filed"),
  mode: EfileModeSchema,
  caseNumber: z.string(),
  filedAt: z.string().datetime(),
  receiptNumber: z.string(),
  receiptUrl: z.string().optional(),
  documentsFiled: z.number().int(),
  district: EfileDistrictSchema,
  message: z.string(),
  pacerFeeCents: z.number().int().nonnegative().optional(),
});

export type FilingResult = z.infer<typeof FilingResultSchema>;

export const FilingJobSchema = z.object({
  id: z.string(),
  matterId: z.string(),
  status: FilingStatusSchema,
  mode: EfileModeSchema,
  package: FilingPackageSchema.optional(),
  result: FilingResultSchema.optional(),
  errorMessage: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type FilingJob = z.infer<typeof FilingJobSchema>;

export interface BuildPackageInput {
  matterId: string;
  firmId: string;
  district: EfileDistrict;
  chapter: EfileChapter;
  debtorDisplayName: string;
  attorneyName: string;
  /** Approved form IDs present on the matter */
  approvedFormIds: string[];
  includeLocalForms?: boolean;
  includePlan?: boolean;
}
