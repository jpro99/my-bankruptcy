"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileStack, Loader2 } from "lucide-react";
import { fetchFilingPackage } from "@/lib/api-client";
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
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <Badge className="mb-2">Petition Bundle</Badge>
        <h1 className="font-display text-3xl font-bold">Filing packet</h1>
        <p className="mt-2 text-muted-foreground">
          {pkg.district} · {pkg.divisionName} · Chapter {pkg.chapter} ·{" "}
          {pkg.petitionCompletion}% petition complete · e-file mode: {pkg.efileMode}
        </p>
      </header>

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
          Approve fields in The Forge to populate the full petition bundle.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href={`/matters/${matterId}/forge`}>
            <FileStack className="size-4" />
            The Forge → Strike The Gavel
          </Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href={`/matters/${matterId}/schedules`}>View schedules</Link>
        </Button>
      </div>
    </div>
  );
}
