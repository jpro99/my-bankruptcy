"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchPortal, uploadPortalDocument, type PortalData } from "@/lib/api-client";

export function ClientPortal({ token }: { token: string }) {
  const [portal, setPortal] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPortal(token);
      setPortal(data.portal);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleUpload = async (requestId: string) => {
    setUploading(requestId);
    try {
      await uploadPortalDocument(token, requestId, `upload_${Date.now()}.pdf`);
      await load();
    } finally {
      setUploading(null);
    }
  };

  if (loading || !portal) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <p className="text-[var(--muted-foreground)]">Loading your portal…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-md mx-auto p-6 space-y-6">
        <header className="text-center space-y-2 pt-8">
          <p className="text-4xl">📋</p>
          <h1 className="text-2xl font-bold">Hi, {portal.debtorName}</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Chapter {portal.chapter} bankruptcy
            {portal.caseNumber && ` · Case ${portal.caseNumber}`}
          </p>
          <p className="text-sm bg-blue-100 text-blue-800 rounded-lg p-3">{portal.message}</p>
        </header>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            Documents needed
          </h2>
          {portal.requests.map((req) => (
            <div
              key={req.id}
              className={`rounded-xl border p-4 space-y-2 ${
                req.status === "complete" || req.status === "uploaded"
                  ? "bg-green-50 border-green-200"
                  : "bg-white border-gray-200 shadow-sm"
              }`}
            >
              <div className="flex justify-between items-start gap-2">
                <h3 className="font-semibold text-sm">{req.title}</h3>
                <span className="text-xs text-[var(--muted-foreground)]">Due {req.dueDate}</span>
              </div>
              <p className="text-xs text-[var(--muted-foreground)]">{req.description}</p>
              {req.uploadedFileName && (
                <p className="text-xs text-green-700">✓ {req.uploadedFileName}</p>
              )}
              {req.status === "open" && (
                <button
                  type="button"
                  disabled={uploading === req.id}
                  onClick={() => void handleUpload(req.id)}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {uploading === req.id ? "Uploading…" : "📷 Upload photo or PDF"}
                </button>
              )}
              {req.status === "uploaded" && (
                <p className="text-xs text-green-600 font-medium">Uploaded — attorney reviewing</p>
              )}
            </div>
          ))}
        </section>

        <p className="text-center text-xs text-[var(--muted-foreground)] pb-8">
          Powered by My Bankruptcy · Secure client portal
        </p>
      </div>
    </div>
  );
}
