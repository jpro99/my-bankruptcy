import { z } from "zod";

export const PreflightSeveritySchema = z.enum(["error", "warning", "info"]);

export type PreflightSeverity = z.infer<typeof PreflightSeveritySchema>;

export const PreflightRuleResultSchema = z.object({
  ruleId: z.string(),
  category: z.string(),
  severity: PreflightSeveritySchema,
  message: z.string(),
  formReference: z.string().optional(),
  passed: z.boolean(),
});

export type PreflightRuleResult = z.infer<typeof PreflightRuleResultSchema>;

export const PreflightReportSchema = z.object({
  matterId: z.string(),
  chapter: z.enum(["7", "13"]),
  district: z.string(),
  totalRules: z.number(),
  passed: z.number(),
  errors: z.number(),
  warnings: z.number(),
  readyToFile: z.boolean(),
  results: z.array(PreflightRuleResultSchema),
  evaluatedAt: z.string().datetime(),
});

export type PreflightReport = z.infer<typeof PreflightReportSchema>;

export interface PreflightContext {
  matterId: string;
  chapter: "7" | "13";
  district: string;
  hasDebtor1: boolean;
  hasIncomeSchedule: boolean;
  hasExpenseSchedule: boolean;
  pendingFieldCount: number;
  presumptionOfAbuse: boolean;
  exemptionGaps: number;
  creditPulled: boolean;
  planFeasible?: boolean;
  bestInterestPassed?: boolean;
  localFormsComplete?: boolean;
}

type RuleFn = (ctx: PreflightContext) => PreflightRuleResult;

const rules: RuleFn[] = [
  (ctx) => ({
    ruleId: "PET-001",
    category: "Petition",
    severity: "error",
    message: ctx.hasDebtor1 ? "Debtor 1 identified" : "Debtor 1 name missing on petition",
    formReference: "101",
    passed: ctx.hasDebtor1,
  }),
  (ctx) => ({
    ruleId: "SCH-I-001",
    category: "Schedules",
    severity: "error",
    message: ctx.hasIncomeSchedule ? "Schedule I complete" : "Schedule I income missing",
    formReference: "106I",
    passed: ctx.hasIncomeSchedule,
  }),
  (ctx) => ({
    ruleId: "SCH-J-001",
    category: "Schedules",
    severity: "error",
    message: ctx.hasExpenseSchedule ? "Schedule J complete" : "Schedule J expenses missing",
    formReference: "106J",
    passed: ctx.hasExpenseSchedule,
  }),
  (ctx) => ({
    ruleId: "REV-001",
    category: "Review",
    severity: "error",
    message:
      ctx.pendingFieldCount === 0
        ? "All AI fields approved"
        : `${ctx.pendingFieldCount} fields pending attorney approval`,
    passed: ctx.pendingFieldCount === 0,
  }),
  (ctx) => ({
    ruleId: "MT-001",
    category: "Means Test",
    severity: ctx.chapter === "7" && ctx.presumptionOfAbuse ? "error" : "info",
    message: ctx.presumptionOfAbuse
      ? "§707(b) presumption of abuse — Ch 7 filing blocked"
      : "Means test clear — no presumption of abuse",
    formReference: "122A-1",
    passed: !ctx.presumptionOfAbuse || ctx.chapter === "13",
  }),
  (ctx) => ({
    ruleId: "EX-001",
    category: "Exemptions",
    severity: "warning",
    message:
      ctx.exemptionGaps === 0
        ? "Exemption coverage complete"
        : `${ctx.exemptionGaps} exemption gap(s) detected`,
    formReference: "106C",
    passed: ctx.exemptionGaps === 0,
  }),
  (ctx) => ({
    ruleId: "CR-001",
    category: "Credit",
    severity: "warning",
    message: ctx.creditPulled ? "Tri-merge credit imported" : "Credit report not pulled",
    passed: ctx.creditPulled,
  }),
  (ctx) => ({
    ruleId: "CACB-PLAN-001",
    category: "CACB Local",
    severity: "error",
    message:
      ctx.chapter === "13"
        ? ctx.planFeasible
          ? "Chapter 13 plan feasible"
          : "Chapter 13 plan fails feasibility"
        : "N/A — Chapter 7",
    formReference: "F-3015-1.01",
    passed: ctx.chapter === "7" || !!ctx.planFeasible,
  }),
  (ctx) => ({
    ruleId: "CACB-BIT-001",
    category: "CACB Local",
    severity: "error",
    message:
      ctx.chapter === "13"
        ? ctx.bestInterestPassed
          ? "Best interest of creditors test passed"
          : "Best interest test failed — §1325(a)(4)"
        : "N/A — Chapter 7",
    formReference: "F-3015-1.01",
    passed: ctx.chapter === "7" || !!ctx.bestInterestPassed,
  }),
  (ctx) => ({
    ruleId: "CACB-LOCAL-001",
    category: "CACB Local",
    severity: "warning",
    message: ctx.localFormsComplete
      ? "CACB local forms complete"
      : "CACB local forms incomplete",
    passed: !!ctx.localFormsComplete,
  }),
];

/** Core preflight rules — extensible to 247+ (CINcompass parity) */
export function runPreflight(ctx: PreflightContext): PreflightReport {
  const results = rules.map((rule) => rule(ctx));
  const errors = results.filter((r) => !r.passed && r.severity === "error").length;
  const warnings = results.filter((r) => !r.passed && r.severity === "warning").length;
  const passed = results.filter((r) => r.passed).length;

  return {
    matterId: ctx.matterId,
    chapter: ctx.chapter,
    district: ctx.district,
    totalRules: results.length,
    passed,
    errors,
    warnings,
    readyToFile: errors === 0,
    results,
    evaluatedAt: new Date().toISOString(),
  };
}

export const PREFLIGHT_RULE_COUNT = rules.length;
