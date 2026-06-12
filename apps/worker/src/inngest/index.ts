export { inngest } from "./client.js";
export { functions as intakeFunctions } from "./functions/intake-pipeline.js";
export {
  classifyCreditTradelinesJob,
  triggerCreditPull,
} from "./functions/credit-pipeline.js";

import { functions as intakeFunctions } from "./functions/intake-pipeline.js";
import {
  classifyCreditTradelinesJob,
  triggerCreditPull,
} from "./functions/credit-pipeline.js";

export const functions = [...intakeFunctions, classifyCreditTradelinesJob, triggerCreditPull];
