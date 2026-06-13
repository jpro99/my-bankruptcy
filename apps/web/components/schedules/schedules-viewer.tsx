"use client";

import { useCallback, useEffect, useState } from "react";
import {
  addManualCreditor,
  fetchCreditReview,
  fetchSchedules,
  patchTradeline,
  setMatterDistrict,
  updateScheduleItem,
  type DistrictInfo,
  type ManualCreditorInput,
  type PetitionLineItem,
  type PetitionSchedule,
  type PetitionView,
  type TradelineReviewEntry,
  type ValuationProvenance,
} from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Loader2, MapPin, Pencil, Check, X, FileSearch, Plus } from "lucide-react";
import { ValuationSourceModal } from "./valuation-source-modal";
import { AddCreditorModal } from "@/components/credit/add-creditor-modal";
import { TradelineControls } from "@/components/credit/tradeline-controls";

const DEBT_SCHEDULE_IDS = new Set(["schedule-d", "schedule-ef", "schedule-g"]);

const STATUS_VARIANT: Record<string, "success" | "warning" | "default" | "secondary" | "outline"> = {
  approved: "success",
  edited: "default",
  computed: "secondary",
  imported: "secondary",
  pending: "warning",
  questioned: "outline",
};

const STATUS_LABEL: Record<string, string> = {
  computed: "Auto-valued",
  imported: "From credit",
  approved: "Approved",
  edited: "Edited",
  pending: "Pending",
  questioned: "Questioned",
};

const TIER_LABEL: Record<ValuationProvenance["tier"], string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export function SchedulesViewer({ matterId }: { matterId: string }) {
  const [petition, setPetition] = useState<PetitionView | null>(null);
  const [district, setDistrict] = useState<DistrictInfo | null>(null);
  const [activeSchedule, setActiveSchedule] = useState<string>("petition");
  const [countyInput, setCountyInput] = useState("");
  const [countySaved, setCountySaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [valuationItem, setValuationItem] = useState<PetitionLineItem | null>(null);
  const [tradelineEntries, setTradelineEntries] = useState<TradelineReviewEntry[]>([]);
  const [showAddCreditor, setShowAddCreditor] = useState(false);
  const [tradelineSavingId, setTradelineSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [schedData, creditData] = await Promise.all([
        fetchSchedules(matterId),
        fetchCreditReview(matterId).catch(() => null),
      ]);
      setPetition(schedData.petition);
      setDistrict(schedData.district);
      setCountyInput(schedData.district.county);
      if (creditData) setTradelineEntries(creditData.entries);
      if (schedData.petition.schedules[0]) {
        setActiveSchedule(schedData.petition.schedules[0].id);
      }
    } finally {
      setLoading(false);
    }
  }, [matterId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCountyUpdate = async () => {
    if (!countyInput.trim()) return;
    setSaving(true);
    setCountySaved(false);
    try {
      const res = await setMatterDistrict(matterId, { county: countyInput.trim() });
      setDistrict(res.district);
      setPetition(res.petition);
      setCountyInput(res.district.county);
      setCountySaved(true);
    } finally {
      setSaving(false);
    }
  };

  const handleItemSave = async (itemId: string, value: string) => {
    const res = await updateScheduleItem(matterId, itemId, value);
    setPetition(res.petition);
    setDistrict(res.district);
    setCountyInput(res.district.county);
  };

  const handleTradelinePatch = async (
    tradelineId: string,
    patch: Parameters<typeof patchTradeline>[2]
  ) => {
    setTradelineSavingId(tradelineId);
    try {
      const res = await patchTradeline(matterId, tradelineId, patch);
      setTradelineEntries(res.entries);
      setPetition(res.petition);
    } finally {
      setTradelineSavingId(null);
    }
  };

  const handleAddCreditor = async (input: ManualCreditorInput) => {
    const res = await addManualCreditor(matterId, input);
    setTradelineEntries(res.entries);
    setPetition(res.petition);
    setShowAddCreditor(false);
  };

  const duplicateOptions = tradelineEntries.map((e) => ({
    id: e.id,
    creditorName: e.creditorName,
  }));

  if (loading || !petition || !district) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  const current = petition.schedules.find((s) => s.id === activeSchedule);

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fade-in">
      <header className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge className="mb-2">Petition Schedules</Badge>
            <h1 className="font-display text-3xl font-bold">{petition.debtorName}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Chapter {petition.chapter} · {district.courtName}
            </p>
          </div>
          <div className="text-right">
            <p className="font-display text-4xl font-black text-gradient">
              {petition.overallCompletion}%
            </p>
            <p className="text-xs text-muted-foreground">
              {petition.approvedFields}/{petition.totalFields} fields complete
            </p>
          </div>
        </div>
        <Progress value={petition.overallCompletion} className="h-2" />
      </header>

      <Card className="border-primary/20 bg-primary-muted/20">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              <MapPin className="size-3.5" />
              Filing county (auto-routes district)
            </label>
            <div className="flex flex-wrap gap-2">
              <Badge variant="default">{district.district}</Badge>
              <Badge variant="outline">{district.divisionName} Division</Badge>
            </div>
            <Input
              value={countyInput}
              onChange={(e) => setCountyInput(e.target.value)}
              placeholder="e.g. Los Angeles, San Francisco, San Diego"
            />
          </div>
          <Button onClick={() => void handleCountyUpdate()} disabled={saving}>
            {saving ? <Loader2 className="animate-spin" /> : "Update district"}
          </Button>
          {countySaved && (
            <p className="text-xs text-success sm:col-span-2">
              Saved — {district.district} · {district.divisionName} · {district.county} County
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {petition.schedules.map((schedule) => (
          <button
            key={schedule.id}
            type="button"
            onClick={() => setActiveSchedule(schedule.id)}
            className={cn(
              "shrink-0 rounded-xl border px-4 py-3 text-left transition min-w-[140px]",
              activeSchedule === schedule.id
                ? "border-primary bg-primary text-white shadow-md"
                : "border-border bg-card hover:border-primary/40"
            )}
          >
            <p className="text-xs font-bold opacity-80">Form {schedule.formId}</p>
            <p className="text-sm font-semibold truncate">{schedule.title.split("—")[0]?.trim()}</p>
            <p className="mt-1 text-xs opacity-70">{schedule.completionPercent}%</p>
          </button>
        ))}
      </div>

      {current && (
        <SchedulePanel
          schedule={current}
          tradelineEntries={tradelineEntries}
          duplicateOptions={duplicateOptions}
          tradelineSavingId={tradelineSavingId}
          onSaveItem={(id, value) => handleItemSave(id, value)}
          onViewValuation={setValuationItem}
          onTradelinePatch={handleTradelinePatch}
          onAddCreditor={() => setShowAddCreditor(true)}
        />
      )}

      {showAddCreditor && (
        <AddCreditorModal
          onClose={() => setShowAddCreditor(false)}
          onSubmit={handleAddCreditor}
        />
      )}

      {valuationItem?.valuation && (
        <ValuationSourceModal
          item={valuationItem}
          debtorName={petition.debtorName}
          onClose={() => setValuationItem(null)}
        />
      )}
    </div>
  );
}

function SchedulePanel({
  schedule,
  tradelineEntries,
  duplicateOptions,
  tradelineSavingId,
  onSaveItem,
  onViewValuation,
  onTradelinePatch,
  onAddCreditor,
}: {
  schedule: PetitionSchedule;
  tradelineEntries: TradelineReviewEntry[];
  duplicateOptions: { id: string; creditorName: string }[];
  tradelineSavingId: string | null;
  onSaveItem: (itemId: string, value: string) => Promise<void>;
  onViewValuation: (item: PetitionLineItem) => void;
  onTradelinePatch: (
    tradelineId: string,
    patch: Parameters<typeof patchTradeline>[2]
  ) => Promise<void>;
  onAddCreditor: () => void;
}) {
  const isDebtSchedule = DEBT_SCHEDULE_IDS.has(schedule.id);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const startEdit = (itemId: string, value: string) => {
    setEditingId(itemId);
    setEditValue(value);
  };

  const saveEdit = async (itemId: string) => {
    setSavingId(itemId);
    try {
      await onSaveItem(itemId, editValue);
      setEditingId(null);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle>{schedule.title}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{schedule.description}</p>
          </div>
          <Badge variant="outline">
            {schedule.approvedCount}/{schedule.itemCount} complete
          </Badge>
          {isDebtSchedule && (
            <Button type="button" size="sm" variant="secondary" onClick={onAddCreditor}>
              <Plus className="size-3.5" />
              Add creditor
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {schedule.items.length === 0 ? (
          <div className="space-y-4 py-8 text-center text-sm text-muted-foreground">
            <p>
              {isDebtSchedule
                ? "No creditors on this schedule yet — pull credit or add manually."
                : "No items yet — run intake and pull credit to populate."}
            </p>
            {isDebtSchedule && (
              <Button type="button" variant="secondary" size="sm" onClick={onAddCreditor}>
                <Plus className="size-4" />
                Add creditor not on credit report
              </Button>
            )}
          </div>
        ) : (
          schedule.items.map((item) => {
            const tradelineEntry = tradelineEntries.find((e) => e.id === item.id);
            return (
            <div
              key={item.id}
              className="flex flex-col gap-2 rounded-lg border border-border p-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium">{item.label}</p>
                {editingId === item.id ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="max-w-md"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      disabled={savingId === item.id}
                      onClick={() => void saveEdit(item.id)}
                    >
                      {savingId === item.id ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <Check className="size-4" />
                      )}
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                      <X className="size-4" />
                    </Button>
                  </div>
                ) : (
                  <p className="mt-0.5 text-sm text-muted-foreground">{item.value}</p>
                )}
                {item.isManual && (
                  <Badge variant="default" className="mt-2 text-[10px] uppercase">
                    Not on credit report
                  </Badge>
                )}
                {tradelineEntry && isDebtSchedule && (
                  <div className="mt-3">
                    <TradelineControls
                      entry={tradelineEntry}
                      duplicateOptions={duplicateOptions}
                      saving={tradelineSavingId === item.id}
                      compact
                      onScheduleChange={(s) => void onTradelinePatch(item.id, { schedule: s })}
                      onMarkDuplicate={(isDuplicate, duplicateOfId) =>
                        void onTradelinePatch(item.id, {
                          isDuplicate,
                          duplicateOfId: duplicateOfId ?? null,
                        })
                      }
                    />
                  </div>
                )}
                {item.sourceDocument && (
                  <p className="mt-1 text-xs text-primary">{item.sourceDocument}</p>
                )}
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                {item.valuation && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => onViewValuation(item)}
                  >
                    <FileSearch className="size-3.5" />
                    {TIER_LABEL[item.valuation.tier]} · View source
                  </Button>
                )}
                {item.confidence !== undefined && (
                  <span className="text-xs text-muted-foreground">
                    {Math.round(item.confidence * 100)}%
                  </span>
                )}
                <Badge variant={STATUS_VARIANT[item.status] ?? "outline"}>
                  {STATUS_LABEL[item.status] ?? item.status}
                </Badge>
                {editingId !== item.id && item.id !== "chapter-election" && item.id !== "district-filing" && item.id !== "means-computed" && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => startEdit(item.id, item.value)}
                  >
                    <Pencil className="size-3.5" />
                    Edit
                  </Button>
                )}
              </div>
            </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
