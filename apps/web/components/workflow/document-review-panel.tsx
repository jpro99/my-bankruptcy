"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { fetchMatterDossier, verifyIntakeDocument, type IntakeDocument } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function DocumentReviewPanel({ matterId }: { matterId: string }) {
  const [documents, setDocuments] = useState<IntakeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { dossier } = await fetchMatterDossier(matterId);
      setDocuments(dossier.documents);
    } finally {
      setLoading(false);
    }
  }, [matterId]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleVerify = async (doc: IntakeDocument) => {
    setBusyId(doc.id);
    try {
      await verifyIntakeDocument(matterId, doc.id, {
        verified: !doc.staffVerified,
      });
      await load();
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <Loader2 className="size-6 animate-spin text-primary" />;
  }

  const verifiedCount = documents.filter((d) => d.staffVerified).length;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Document QA — staff double-check</h2>
        <p className="text-sm text-muted-foreground">
          Verify each client upload matches what goes on the petition. {verifiedCount}/{documents.length}{" "}
          verified.
        </p>
      </div>

      {documents.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No documents yet — client uploads appear from Client Vault or Document Drop.
        </p>
      ) : (
        <ul className="space-y-2">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
            >
              <div>
                <p className="font-medium">{doc.fileName}</p>
                <p className="text-xs text-muted-foreground">
                  {doc.documentType} · {doc.uploadedBy} · {doc.status}
                  {doc.staffVerifiedAt && ` · verified ${doc.staffVerifiedAt.slice(0, 10)}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {doc.staffVerified ? (
                  <Badge variant="success">Verified</Badge>
                ) : (
                  <Badge variant="warning">Needs review</Badge>
                )}
                <Button
                  size="sm"
                  variant={doc.staffVerified ? "secondary" : "default"}
                  disabled={busyId === doc.id}
                  onClick={() => void toggleVerify(doc)}
                >
                  {busyId === doc.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : doc.staffVerified ? (
                    "Undo"
                  ) : (
                    <>
                      <CheckCircle2 className="size-4" />
                      Verify
                    </>
                  )}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
