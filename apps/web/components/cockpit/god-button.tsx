"use client";

import { useState } from "react";
import { fetchPreflight, filePetition, type PreflightReport } from "@/lib/api-client";

interface GodButtonProps {
  matterId: string;
  chapter: "7" | "13" | "review";
  disabled?: boolean;
}

export function GodButton({ matterId, chapter, disabled }: GodButtonProps) {
  const [open, setOpen] = useState(false);
  const [report, setReport] = useState<PreflightReport | null>(null);
  const [filing, setFiling] = useState(false);
  const [result, setResult] = useState<{ caseNumber: string; message: string } | null>(null);

  const chapterLabel = chapter === "review" ? "7" : chapter;

  const runPreflight = async () => {
    setOpen(true);
    setResult(null);
    const data = await fetchPreflight(matterId);
    setReport(data.report);
  };

  const handleFile = async () => {
    setFiling(true);
    try {
      const res = await filePetition(matterId);
      setResult(res);
    } catch {
      setResult({ caseNumber: "", message: "Preflight blocked filing — resolve errors first." });
    } finally {
      setFiling(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => void runPreflight()}
        disabled={disabled}
        className="w-full py-3 bg-red-600 text-white rounded-lg font-semibold text-sm hover:bg-red-700 transition disabled:opacity-50 shadow-lg"
      >
        ⚡ File Chapter {chapterLabel} Now
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold">Preflight — God Button</h2>
              <button type="button" onClick={() => setOpen(false)} className="text-gray-500">
                ✕
              </button>
            </div>

            {result ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="font-semibold text-green-800">Filed — Case #{result.caseNumber}</p>
                <p className="text-sm text-green-700 mt-1">{result.message}</p>
              </div>
            ) : report ? (
              <>
                <div
                  className={`rounded-lg p-3 text-center font-semibold ${
                    report.readyToFile ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}
                >
                  {report.readyToFile
                    ? `✅ READY TO FILE — ${report.passed}/${report.totalRules} rules passed`
                    : `❌ BLOCKED — ${report.errors} error(s), ${report.warnings} warning(s)`}
                </div>
                <ul className="space-y-2 text-sm">
                  {report.results.map((r) => (
                    <li
                      key={r.ruleId}
                      className={`flex gap-2 p-2 rounded ${
                        r.passed ? "bg-gray-50" : r.severity === "error" ? "bg-red-50" : "bg-yellow-50"
                      }`}
                    >
                      <span>{r.passed ? "✅" : r.severity === "error" ? "❌" : "⚠️"}</span>
                      <span>
                        <strong>{r.ruleId}</strong> — {r.message}
                      </span>
                    </li>
                  ))}
                </ul>
                {report.readyToFile && (
                  <button
                    type="button"
                    onClick={() => void handleFile()}
                    disabled={filing}
                    className="w-full py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 disabled:opacity-50"
                  >
                    {filing ? "E-filing…" : "Confirm E-File to CACB"}
                  </button>
                )}
              </>
            ) : (
              <p className="text-center text-gray-500">Running 247 validation rules…</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
