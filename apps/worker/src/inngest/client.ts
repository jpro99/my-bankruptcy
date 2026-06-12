import { Inngest } from "inngest";

export const inngest = new Inngest({ id: "chapterai" });

export type IntakeStartedEvent = {
  name: "matter/intake.started";
  data: {
    matterId: string;
    firmId: string;
    documentIds: string[];
    targetForms: string[];
    runCreditPull?: boolean;
  };
};

export type CreditPullRequestedEvent = {
  name: "credit/pull.requested";
  data: {
    matterId: string;
    firmId: string;
    debtorFirstName: string;
    debtorLastName: string;
    ssnLast4: string;
    annualIncome?: string;
    householdSize?: number;
    chapter?: "7" | "13";
  };
};

export type CreditPullCompletedEvent = {
  name: "credit/pull.completed";
  data: {
    matterId: string;
    firmId: string;
    pullId: string;
    tradelines: import("@chapterai/credit").CreditTradeline[];
    annualIncome?: string;
    householdSize?: number;
    chapter?: "7" | "13";
  };
};

export type SchedulesPopulatedEvent = {
  name: "matter/schedules.populated";
  data: {
    matterId: string;
    firmId: string;
    diagnostics?: unknown;
    classifiedCount?: number;
  };
};
