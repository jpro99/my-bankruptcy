"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchSchedules,
  setMatterDistrict,
  type DistrictInfo,
  type PetitionSchedule,
  type PetitionView,
} from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Loader2, MapPin } from "lucide-react";

const STATUS_VARIANT: Record<string, "success" | "warning" | "default" | "secondary" | "outline"> = {
  approved: "success",
  edited: "default",
  computed: "secondary",
  imported: "secondary",
  pending: "warning",
  questioned: "outline",
};

export function SchedulesViewer({ matterId }: { matterId: string }) {
  const [petition, setPetition] = useState<PetitionView | null>(null);
  const [district, setDistrict] = useState<DistrictInfo | null>(null);
  const [activeSchedule, setActiveSchedule] = useState<string>("petition");
  const [countyInput, setCountyInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const schedData = await fetchSchedules(matterId);
      setPetition(schedData.petition);
      setDistrict(schedData.district);
      setCountyInput(schedData.district.county);
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
    try {
      const res = await setMatterDistrict(matterId, { county: countyInput.trim() });
      setDistrict(res.district);
      setPetition(res.petition);
    } finally {
      setSaving(false);
    }
  };

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

      {current && <SchedulePanel schedule={current} />}
    </div>
  );
}

function SchedulePanel({ schedule }: { schedule: PetitionSchedule }) {
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
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {schedule.items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No items yet — run intake and pull credit to populate.
          </p>
        ) : (
          schedule.items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-2 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium">{item.label}</p>
                <p className="mt-0.5 text-sm text-muted-foreground truncate">{item.value}</p>
                {item.sourceDocument && (
                  <p className="mt-1 text-xs text-primary">{item.sourceDocument}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {item.confidence !== undefined && (
                  <span className="text-xs text-muted-foreground">
                    {Math.round(item.confidence * 100)}%
                  </span>
                )}
                <Badge variant={STATUS_VARIANT[item.status] ?? "outline"}>{item.status}</Badge>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
