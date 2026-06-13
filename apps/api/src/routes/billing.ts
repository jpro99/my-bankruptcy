import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { generateInvoice, recordPayment, getFeePackages } from "@chapterai/billing";
import type { AppEnv } from "../index.js";
import {
  getDemoBilling,
  getDemoMatterMeta,
  isDemoMatter,
  setDemoBilling,
} from "../lib/demo-store.js";

export const billingRouter = new Hono<AppEnv>();

billingRouter.get("/packages", (c) => {
  const chapter = c.req.query("chapter") as "7" | "13" | undefined;
  return c.json({ packages: getFeePackages(chapter) });
});

billingRouter.get("/matter/:matterId", async (c) => {
  const matterId = c.req.param("matterId");
  if (!isDemoMatter(matterId)) {
    return c.json({ error: "Matter not found" }, 404);
  }

  let invoice = getDemoBilling(matterId);
  if (!invoice) {
    const meta = getDemoMatterMeta(matterId);
    invoice = generateInvoice({
      matterId,
      chapter: meta.chapter,
      paidAmount: "500.00",
    });
    setDemoBilling(matterId, invoice);
  }

  return c.json({ invoice });
});

const PaymentSchema = z.object({
  amount: z.string(),
  method: z
    .enum(["cash", "check", "card", "zelle", "venmo", "trust", "other"])
    .default("cash"),
  checkNumber: z.string().optional(),
  note: z.string().optional(),
  receivedBy: z.string().optional(),
});

billingRouter.post(
  "/matter/:matterId/payment",
  zValidator("json", PaymentSchema),
  async (c) => {
    const matterId = c.req.param("matterId");
    const body = c.req.valid("json");

    if (!isDemoMatter(matterId)) {
      return c.json({ error: "Matter not found" }, 404);
    }

    let invoice = getDemoBilling(matterId);
    if (!invoice) {
      const meta = getDemoMatterMeta(matterId);
      invoice = generateInvoice({ matterId, chapter: meta.chapter });
    }

    const updated = recordPayment(invoice, body);
    setDemoBilling(matterId, updated);
    const lastReceipt = updated.payments?.[updated.payments.length - 1];
    return c.json({ invoice: updated, receipt: lastReceipt });
  }
);
