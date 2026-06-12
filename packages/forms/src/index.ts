export * from "./common.js";
export * from "./schedules/schedule-a-b.js";
export * from "./schedules/schedule-c.js";
export * from "./schedules/schedule-d.js";
export * from "./schedules/schedule-e-f.js";
export * from "./schedules/schedule-i-j.js";
export * from "./schedules/schedule-g.js";
export * from "./classifiers/tradeline-classifier.js";
export * from "./cacb/index.js";
export * from "./official/form-101.js";

export const FORM_IDS = [
  "101",
  "106A/B",
  "106C",
  "106D",
  "106E/F",
  "106G",
  "106H",
  "106I",
  "106J",
  "122A-1",
  "122A-2",
  "122C-1",
  "122C-2",
] as const;

export type FormId = (typeof FORM_IDS)[number];
