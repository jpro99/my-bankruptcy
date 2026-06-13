"use client";

import { create } from "zustand";
import type { ReviewField, MatterDiagnostics } from "../types";
import { DEMO_REVIEW_FIELDS, DEMO_DIAGNOSTICS } from "../types";
import {
  fetchReviewQueue,
  fetchDiagnostics,
  approveField as apiApprove,
  bulkApproveFields,
  questionField as apiQuestion,
  pullCredit,
  type ApiDiagnostics,
} from "../api-client";

interface ReviewStore {
  matterId: string | null;
  fields: ReviewField[];
  diagnostics: MatterDiagnostics;
  creditSummary: ApiDiagnostics["creditSummary"] | null;
  loading: boolean;
  error: string | null;
  currentIndex: number;
  init: (matterId: string) => Promise<void>;
  refreshDiagnostics: () => Promise<void>;
  pullTriMerge: () => Promise<void>;
  approve: (fieldId: string) => Promise<void>;
  question: (fieldId: string) => Promise<void>;
  edit: (fieldId: string, newValue: unknown) => void;
  bulkApprove: (minConfidence: number) => Promise<number>;
  next: () => void;
  prev: () => void;
  pendingCount: () => number;
  pendingFields: () => ReviewField[];
}

function mapDiagnostics(d: ApiDiagnostics): MatterDiagnostics {
  return {
    missingFields: d.missingFields,
    exemptionGaps: d.exemptionGaps,
    meansTestStatus: d.meansTestStatus,
    presumptionOfAbuse: d.presumptionOfAbuse,
    chapterRecommendation: d.chapterRecommendation,
    recommendationRationale: d.recommendationRationale,
  };
}

function mapFields(fields: ReviewField[]): ReviewField[] {
  return fields;
}

export const useReviewStore = create<ReviewStore>((set, get) => ({
  matterId: null,
  fields: DEMO_REVIEW_FIELDS,
  diagnostics: DEMO_DIAGNOSTICS,
  creditSummary: null,
  loading: false,
  error: null,
  currentIndex: 0,

  init: async (matterId) => {
    set({ loading: true, error: null, matterId });
    try {
      const [queue, diag] = await Promise.all([
        fetchReviewQueue(matterId),
        fetchDiagnostics(matterId),
      ]);
      set({
        fields: mapFields(queue.fields as ReviewField[]),
        diagnostics: mapDiagnostics(diag.diagnostics),
        creditSummary: diag.diagnostics.creditSummary ?? null,
        loading: false,
        currentIndex: 0,
      });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : "Failed to load matter",
        fields: DEMO_REVIEW_FIELDS,
        diagnostics: DEMO_DIAGNOSTICS,
      });
    }
  },

  refreshDiagnostics: async () => {
    const { matterId } = get();
    if (!matterId) return;
    const diag = await fetchDiagnostics(matterId);
    set({
      diagnostics: mapDiagnostics(diag.diagnostics),
      creditSummary: diag.diagnostics.creditSummary ?? null,
    });
  },

  pullTriMerge: async () => {
    const { matterId } = get();
    if (!matterId) return;
    set({ loading: true });
    try {
      await pullCredit(matterId);
      await get().init(matterId);
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : "Credit pull failed",
      });
    }
  },

  approve: async (fieldId) => {
    const { matterId } = get();
    if (!matterId) {
      set((s) => {
        const fields = s.fields.map((f) =>
          f.id === fieldId ? { ...f, approvalState: "approved" as const } : f
        );
        const pending = fields.filter((f) => f.approvalState === "pending");
        return {
          fields,
          currentIndex: Math.min(s.currentIndex, Math.max(0, pending.length - 1)),
        };
      });
      return;
    }
    try {
      await apiApprove(matterId, fieldId);
      set((s) => {
        const fields = s.fields.map((f) =>
          f.id === fieldId ? { ...f, approvalState: "approved" as const } : f
        );
        const pending = fields.filter((f) => f.approvalState === "pending");
        return {
          fields,
          currentIndex: Math.min(s.currentIndex, Math.max(0, pending.length - 1)),
        };
      });
      await get().refreshDiagnostics();
    } catch {
      set((s) => {
        const fields = s.fields.map((f) =>
          f.id === fieldId ? { ...f, approvalState: "approved" as const } : f
        );
        const pending = fields.filter((f) => f.approvalState === "pending");
        return {
          fields,
          currentIndex: Math.min(s.currentIndex, Math.max(0, pending.length - 1)),
        };
      });
    }
  },

  question: async (fieldId) => {
    const { matterId } = get();
    if (matterId) await apiQuestion(matterId, fieldId).catch(() => undefined);
    set((s) => ({
      fields: s.fields.map((f) =>
        f.id === fieldId ? { ...f, approvalState: "questioned" as const } : f
      ),
    }));
  },

  edit: (fieldId, newValue) => {
    set((s) => ({
      fields: s.fields.map((f) =>
        f.id === fieldId
          ? { ...f, proposedValue: newValue, approvalState: "edited" as const }
          : f
      ),
    }));
  },

  bulkApprove: async (minConfidence) => {
    const { matterId, fields } = get();
    if (matterId) {
      try {
        const result = (await bulkApproveFields(matterId, minConfidence)) as {
          approvedCount: number;
        };
        await get().init(matterId);
        return result.approvedCount;
      } catch {
        /* fall through to local */
      }
    }
    let count = 0;
    set((s) => ({
      fields: s.fields.map((f) => {
        if (f.approvalState === "pending" && f.confidence >= minConfidence) {
          count += 1;
          return { ...f, approvalState: "approved" as const };
        }
        return f;
      }),
    }));
    return count;
  },

  next: () => {
    const pending = get().fields.filter((f) => f.approvalState === "pending");
    set((s) => ({
      currentIndex: Math.min(s.currentIndex + 1, Math.max(0, pending.length - 1)),
    }));
  },

  prev: () => set((s) => ({ currentIndex: Math.max(s.currentIndex - 1, 0) })),

  pendingCount: () => get().fields.filter((f) => f.approvalState === "pending").length,

  pendingFields: () => get().fields.filter((f) => f.approvalState === "pending"),
}));
