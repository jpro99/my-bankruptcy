"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileStack, Loader2 } from "lucide-react";
import { fetchFilingPackage } from "@/lib/api-client";
import { BRAND } from "@/lib/brand";
import { CourtPacketPreview } from "@/components/filing/court-packet-preview";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function FilingPacketPanel({ matterId }: { matterId: string }) {
  const [pkg, setPkg] = useState<Awaited<ReturnType<typeof fetchFilingPackage>>["package"] | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchFilingPackage(matterId)
      .then((d) => setPkg(d.package))
      .finally(() => setLoading(false));
  }, [matterId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!pkg) return null;

  return (
    <div className="space-y-8">
      <header>
        <Badge className="mb-2">Petition Bundle</Badge>
        <h1 className="font-display text-3xl font-bold">Filing packet</h1>
        <p className="mt-2 text-muted-foreground">
          {pkg.district} · {pkg.divisionName} · Chapter {pkg.chapter} ·{" "}
          {pkg.petitionCompletion}% petition complete · e-file mode: {pkg.efileMode}
        </p>
      </header>

      <CourtPacketPreview matterId={matterId} layout="inline" />

      <Card>
        <CardContent className="p-0">
          <table className="matters-table">
            <thead>
              <tr>
                <th>Form</th>
                <th>Description</th>
                <th>CM/ECF</th>
              </tr>
            </thead>
            <tbody>
              {pkg.documents.map((doc) => (
                <tr key={doc.formId}>
                  <td className="font-semibold">{doc.formId}</td>
                  <td>{doc.label}</td>
                  <td>
                    <Badge variant="secondary">{doc.eventCode}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {pkg.documents.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Approve fields in petition review to populate the full court bundle.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href={`/matters/${matterId}/forge/review`}>
            <FileStack className="size-4" />
            Petition review → {BRAND.gavel.action}
          </Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href={`/matters/${matterId}/court-preview`} target="_blank" rel="noopener noreferrer">
            Open court preview in new window
          </Link>
        </Button>
      </div>
    </div>
  );
}
