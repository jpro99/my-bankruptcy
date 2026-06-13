export { inngest } from "./client.js";
export { functions as intakeFunctions } from "./functions/intake-pipeline.js";
export {
  classifyCreditTradelinesJob,
  triggerCreditPull,
} from "./functions/credit-pipeline.js";
export { efileSubmissionJob, efileCompletedAutopilotJob } from "./functions/efile-pipeline.js";
export {
  autopilotDailyTick,
  autopilotRunAutoAction,
  autopilotTimelineReady,
} from "./functions/autopilot-pipeline.js";

import { functions as intakeFunctions } from "./functions/intake-pipeline.js";
import {
  classifyCreditTradelinesJob,
  triggerCreditPull,
} from "./functions/credit-pipeline.js";
import { efileSubmissionJob, efileCompletedAutopilotJob } from "./functions/efile-pipeline.js";
import {
  autopilotDailyTick,
  autopilotRunAutoAction,
  autopilotTimelineReady,
} from "./functions/autopilot-pipeline.js";

export const functions = [
  ...intakeFunctions,
  classifyCreditTradelinesJob,
  triggerCreditPull,
  efileSubmissionJob,
  efileCompletedAutopilotJob,
  autopilotDailyTick,
  autopilotRunAutoAction,
  autopilotTimelineReady,
];
