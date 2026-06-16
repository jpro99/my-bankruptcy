"use client";

import { useCallback, useEffect, useState } from "react";
import {
  addManualCreditor,
  addScheduleAsset,
  addScheduleCodebtor,
  addScheduleLine,
  fetchCreditReview,
  fetchSchedules,
  patchTradeline,
  removeScheduleItem,
  setMatterDistrict,
  updateScheduleItem,
  type AddAssetInput,
  type AddCodebtorInput,
  type AddScheduleLineInput,
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
import { Loader2, MapPin, Pencil, Check, X, FileSearch, Plus, Trash2 } from "lucide-react";
import { ValuationSourceModal } from "./valuation-source-modal";
import { AddCreditorModal } from "@/components/credit/add-creditor-modal";
import { AddScheduleAssetModal } from "./add-schedule-asset-modal";
import { AddScheduleLineModal } from "./add-schedule-line-modal";
import { AddCodebtorModal } from "./add-codebtor-modal";
import { TradelineControls } from "@/components/credit/tradeline-controls";

const DEBT_SCHEDULE_IDS = new Set(["schedule-d", "schedule-ef", "schedule-g"]);

const NON_EDITABLE_IDS = new Set([
  "chapter-election",
  "district-filing",
  "means-computed",
  "j-total",
  "placeholder-i",
  "placeholder-j",
  "placeholder-h",
]);

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

function stripDisplayValue(value: string): string {
  return value.replace(/^\$/, "").replace(/\s*\(secured:.*\)$/, "").trim();
}

export function SchedulesViewer({
  matterId,
  initialScheduleId,
}: {
  matterId: string;
  initialScheduleId?: string | null;
}) {
  const [petition, setPetition] = useState<PetitionView | null>(null);
  const [district, setDistrict] = useState<DistrictInfo | null>(null);
  const [activeSchedule, setActiveSchedule] = useState<string>("schedule-ab");
  const [countyInput, setCountyInput] = useState("");
  const [countySaved, setCountySaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [valuationItem, setValuationItem] = useState<PetitionLineItem | null>(null);
  const [tradelineEntries, setTradelineEntries] = useState<TradelineReviewEntry[]>([]);
  const [showAddCreditor, setShowAddCreditor] = useState(false);
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [addLineFormId, setAddLineFormId] = useState<"106I" | "106J" | "107" | null>(null);
  const [showAddCodebtor, setShowAddCodebtor] = useState(false);
  const [tradelineSavingId, setTradelineSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [schedData, creditData] = await Promise.all([
        fetchSchedules(matterId),
        fetchCreditReview(matterId).catch(() => null),
      ]);
      setPetition(schedData.petition);
      setDistrict(schedData.district);
      setCountyInput(schedData.district.county);
      if (creditData) setTradelineEntries(creditData.entries);
      if (initialScheduleId) {
        const match = schedData.petition.schedules.find((s) => s.id === initialScheduleId);
        if (match) setActiveSchedule(match.id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load schedules");
    } finally {
      setLoading(false);
    }
  }, [matterId, initialScheduleId]);

  useEffect(() => {
    void load();
  }, [load]);

  const applyPetition = (res: { petition: PetitionView; district: DistrictInfo }) => {
    setPetition(res.petition);
    setDistrict(res.district);
    setCountyInput(res.district.county);
  };

  const handleCountyUpdate = async () => {
    if (!countyInput.trim()) return;
    setSaving(true);
    setCountySaved(false);
    try {
      const res = await setMatterDistrict(matterId, { county: countyInput.trim() });
      applyPetition(res);
      setCountySaved(true);
    } finally {
      setSaving(false);
    }
  };

  const handleItemSave = async (
    itemId: string,
    patch: { value?: string; label?: string; description?: string }
  ) => {
    const res = await updateScheduleItem(matterId, itemId, patch);
    applyPetition(res);
  };

  const handleItemRemove = async (itemId: string) => {
    if (!window.confirm("Remove this line from the petition schedules?")) return;
    try {
      const res = await removeScheduleItem(matterId, itemId);
      applyPetition(res);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not remove item");
    }
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

  const handleAddAsset = async (input: AddAssetInput) => {
    const res = await addScheduleAsset(matterId, input);
    applyPetition(res);
    setShowAddAsset(false);
    setActiveSchedule("schedule-ab");
  };

  const handleAddLine = async (input: AddScheduleLineInput) => {
    const res = await addScheduleLine(matterId, input);
    applyPetition(res);
    setAddLineFormId(null);
    setActiveSchedule(input.formId === "106J" ? "schedule-j" : input.formId === "107" ? "sofa" : "schedule-i");
  };

  const handleAddCodebtor = async (input: AddCodebtorInput) => {
    const res = await addScheduleCodebtor(matterId, input);
    applyPetition(res);
    setShowAddCodebtor(false);
    setActiveSchedule("schedule-h");
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
    <div className="staff-panel staff-panel--xl space-y-6 animate-fade-in">
      <header className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge className="mb-2">Petition Schedules</Badge>
            <h1 className="font-display text-3xl font-bold">{petition.debtorName}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Chapter {petition.chapter} · {district.courtName}
            </p>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Attorney control — add, edit, and remove lines on each schedule. Values flow to court
              preview and filing packet.
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

      {error && (
        <p className="rounded-lg border border-red-200 bg-danger-muted px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

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
              placeholder="e.g. Riverside, Los Angeles, San Bernardino"
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
          onSaveItem={handleItemSave}
          onRemoveItem={handleItemRemove}
          onViewValuation={setValuationItem}
          onTradelinePatch={handleTradelinePatch}
          onAddCreditor={() => setShowAddCreditor(true)}
          onAddAsset={() => setShowAddAsset(true)}
          onAddExpenseLine={() => setAddLineFormId("106J")}
          onAddIncomeLine={() => setAddLineFormId("106I")}
          onAddSofaLine={() => setAddLineFormId("107")}
          onAddCodebtor={() => setShowAddCodebtor(true)}
        />
      )}

      {showAddCodebtor && (
        <AddCodebtorModal
          onClose={() => setShowAddCodebtor(false)}
          onSubmit={handleAddCodebtor}
        />
      )}

      {showAddCreditor && (
        <AddCreditorModal
          onClose={() => setShowAddCreditor(false)}
          onSubmit={handleAddCreditor}
        />
      )}

      {showAddAsset && (
        <AddScheduleAssetModal
          onClose={() => setShowAddAsset(false)}
          onSubmit={handleAddAsset}
        />
      )}

      {addLineFormId && (
        <AddScheduleLineModal
          formId={addLineFormId}
          onClose={() => setAddLineFormId(null)}
          onSubmit={handleAddLine}
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
  onRemoveItem,
  onViewValuation,
  onTradelinePatch,
  onAddCreditor,
  onAddAsset,
  onAddExpenseLine,
  onAddIncomeLine,
  onAddSofaLine,
  onAddCodebtor,
}: {
  schedule: PetitionSchedule;
  tradelineEntries: TradelineReviewEntry[];
  duplicateOptions: { id: string; creditorName: string }[];
  tradelineSavingId: string | null;
  onSaveItem: (
    itemId: string,
    patch: { value?: string; label?: string; description?: string }
  ) => Promise<void>;
  onRemoveItem: (itemId: string) => Promise<void>;
  onViewValuation: (item: PetitionLineItem) => void;
  onTradelinePatch: (
    tradelineId: string,
    patch: Parameters<typeof patchTradeline>[2]
  ) => Promise<void>;
  onAddCreditor: () => void;
  onAddAsset: () => void;
  onAddExpenseLine: () => void;
  onAddIncomeLine: () => void;
  onAddSofaLine: () => void;
  onAddCodebtor: () => void;
}) {
  const isDebtSchedule = DEBT_SCHEDULE_IDS.has(schedule.id);
  const isPropertySchedule = schedule.id === "schedule-ab";
  const isExpenseSchedule = schedule.id === "schedule-j";
  const isIncomeSchedule = schedule.id === "schedule-i";
  const isExemptionSchedule = schedule.id === "schedule-c";
  const isCodebtorSchedule = schedule.id === "schedule-h";
  const isSofaSchedule = schedule.id === "sofa";

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editValue, setEditValue] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const startEdit = (item: PetitionLineItem) => {
    setEditingId(item.id);
    setEditLabel(item.label);
    setEditValue(stripDisplayValue(item.value));
  };

  const saveEdit = async (itemId: string) => {
    setSavingId(itemId);
    try {
      const patch: { value?: string; label?: string; description?: string } = {
        value: editValue,
      };
      if (isPropertySchedule || isExemptionSchedule || isExpenseSchedule || isIncomeSchedule || isCodebtorSchedule || isSofaSchedule) {
        patch.label = editLabel;
        if (isPropertySchedule) patch.description = editLabel;
      }
      await onSaveItem(itemId, patch);
      setEditingId(null);
    } finally {
      setSavingId(null);
    }
  };

  const canRemove = (item: PetitionLineItem) => {
    if (NON_EDITABLE_IDS.has(item.id)) return false;
    if (isPropertySchedule && !item.id.startsWith("ex-")) return true;
    if (item.id.startsWith("j-custom-") || item.id.startsWith("i-custom-") || item.id.startsWith("h-custom-") || item.id.startsWith("107-custom-")) return true;
    const tl = tradelineEntries.find((e) => e.id === item.id);
    if (tl?.isManual) return true;
    return false;
  };

  const headerAction = () => {
    if (isDebtSchedule) {
      return (
        <Button type="button" size="sm" variant="secondary" onClick={onAddCreditor}>
          <Plus className="size-3.5" />
          Add creditor
        </Button>
      );
    }
    if (isPropertySchedule) {
      return (
        <Button type="button" size="sm" variant="secondary" onClick={onAddAsset}>
          <Plus className="size-3.5" />
          Add property
        </Button>
      );
    }
    if (isExpenseSchedule) {
      return (
        <Button type="button" size="sm" variant="secondary" onClick={onAddExpenseLine}>
          <Plus className="size-3.5" />
          Add expense line
        </Button>
      );
    }
    if (isIncomeSchedule) {
      return (
        <Button type="button" size="sm" variant="secondary" onClick={onAddIncomeLine}>
          <Plus className="size-3.5" />
          Add income line
        </Button>
      );
    }
    if (isCodebtorSchedule) {
      return (
        <Button type="button" size="sm" variant="secondary" onClick={onAddCodebtor}>
          <Plus className="size-3.5" />
          Add codebtor
        </Button>
      );
    }
    if (isSofaSchedule) {
      return (
        <Button type="button" size="sm" variant="secondary" onClick={onAddSofaLine}>
          <Plus className="size-3.5" />
          Add SOFA question
        </Button>
      );
    }
    return null;
  };

  const emptyHint = () => {
    if (isDebtSchedule) return "No creditors yet — pull credit or add manually.";
    if (isPropertySchedule) return "No property listed — add beds, couches, vehicles, accounts, etc.";
    if (isExpenseSchedule) return "Enter monthly amounts for each expense category below.";
    if (isIncomeSchedule) return "Enter monthly income for each source below.";
    if (isCodebtorSchedule) return "No codebtors — add spouse, guarantor, or other liable party.";
    if (isSofaSchedule) return "Answer each SOFA question — Yes / No / N/A or explain.";
    return "No items yet.";
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
          {headerAction()}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {schedule.items.length === 0 ? (
          <div className="space-y-4 py-8 text-center text-sm text-muted-foreground">
            <p>{emptyHint()}</p>
            {headerAction()}
          </div>
        ) : (
          schedule.items.map((item) => {
            const tradelineEntry = tradelineEntries.find((e) => e.id === item.id);
            const editable = !NON_EDITABLE_IDS.has(item.id);
            const showLabelEdit =
          editable &&
          (isPropertySchedule || isExemptionSchedule || isExpenseSchedule || isIncomeSchedule || isCodebtorSchedule || isSofaSchedule);

            return (
              <div
                key={item.id}
                className={cn(
                  "flex flex-col gap-2 rounded-lg border border-border p-4 sm:flex-row sm:items-start sm:justify-between",
                  item.id === "j-total" && "border-primary/30 bg-primary-muted/30"
                )}
              >
                <div className="min-w-0 flex-1">
                  {editingId === item.id ? (
                    <div className="mt-1 space-y-2">
                      {showLabelEdit && (
                        <Input
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          placeholder="Description"
                          autoFocus
                        />
                      )}
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder="Amount or value"
                      />
                      <div className="flex flex-wrap gap-2">
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
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className={cn("font-medium", item.id === "j-total" && "text-primary")}>
                        {item.label}
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{item.value}</p>
                    </>
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
                  {editingId !== item.id && editable && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => startEdit(item)}
                    >
                      <Pencil className="size-3.5" />
                      Edit
                    </Button>
                  )}
                  {canRemove(item) && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => void onRemoveItem(item.id)}
                    >
                      <Trash2 className="size-3.5" />
                      Remove
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
