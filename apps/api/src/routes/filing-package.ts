import { Hono } from "hono";
import type { AppEnv } from "../index.js";
import { getCourtPacketPreview, getFilingPackagePreview, isDemoMatter } from "../lib/demo-store.js";
import {
  buildCourtFormPdf,
  buildCourtPacketPdf,
  courtPdfFilename,
} from "../lib/court-pdf-service.js";

export const filingRouter = new Hono<AppEnv>();

filingRouter.get("/matter/:matterId/package", async (c) => {
  const matterId = c.req.param("matterId");
  if (!isDemoMatter(matterId)) return c.json({ error: "Matter not found" }, 404);
  return c.json({ package: getFilingPackagePreview(matterId) });
});

filingRouter.get("/matter/:matterId/court-preview", async (c) => {
  const matterId = c.req.param("matterId");
  if (!isDemoMatter(matterId)) return c.json({ error: "Matter not found" }, 404);
  const practice = c.req.query("practice") === "1";
  return c.json({ preview: getCourtPacketPreview(matterId, { practice }) });
});

/** Official-layout PDF — single form (Form B101, B106, CACB local, etc.) */
filingRouter.get("/matter/:matterId/court-pdf/:formId", async (c) => {
  const matterId = c.req.param("matterId");
  const formId = decodeURIComponent(c.req.param("formId"));
  if (!isDemoMatter(matterId)) return c.json({ error: "Matter not found" }, 404);

  const practice = c.req.query("practice") === "1";
  try {
    const pdf = await buildCourtFormPdf(matterId, formId, { practice });
    if (!pdf) return c.json({ error: "Form not found in court packet" }, 404);

    const preview = getCourtPacketPreview(matterId, { practice });
    const filename = courtPdfFilename(formId, preview.debtorName);

    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : "PDF generation failed" }, 400);
  }
});

/** Official-layout PDF — full practice/filing packet */
filingRouter.get("/matter/:matterId/court-pdf", async (c) => {
  const matterId = c.req.param("matterId");
  if (!isDemoMatter(matterId)) return c.json({ error: "Matter not found" }, 404);

  const practice = c.req.query("practice") === "1";
  const formIds = c.req.query("formIds")?.split(",").map((id) => decodeURIComponent(id.trim()));

  try {
    const pdf = await buildCourtPacketPdf(matterId, { practice, formIds });
    const preview = getCourtPacketPreview(matterId, { practice });
    const safeName = preview.debtorName.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_");
    const filename = `Court_Packet_Ch${preview.chapter}_${safeName || matterId}.pdf`;

    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : "PDF generation failed" }, 400);
  }
});
