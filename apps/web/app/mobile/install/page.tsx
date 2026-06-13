import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { InstallPrompt } from "@/components/mobile/install-prompt";
import { BRAND } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function MobileInstallPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <Button asChild variant="ghost" size="sm" className="px-0">
        <Link href="/mobile">
          <ArrowLeft className="size-4" />
          Back to matters
        </Link>
      </Button>

      <header className="space-y-2 text-center">
        <h1 className="font-display text-2xl font-bold">Install {BRAND.reliefPocket.name}</h1>
        <p className="text-sm text-muted-foreground">
          Samsung Galaxy, Pixel, or any Android — add to your home screen like a native app.
        </p>
      </header>

      <InstallPrompt />

      <Card>
        <CardContent className="space-y-4 p-5 text-sm leading-relaxed">
          <div>
            <p className="font-semibold">Samsung Internet</p>
            <ol className="mt-2 list-decimal pl-4 space-y-1 text-muted-foreground">
              <li>Open this page in Samsung Internet</li>
              <li>Menu (☰) → <strong>Add page to</strong> → <strong>Home screen</strong></li>
              <li>Tap <strong>Add</strong> — icon appears on your desktop</li>
            </ol>
          </div>
          <div>
            <p className="font-semibold">Chrome (Android)</p>
            <ol className="mt-2 list-decimal pl-4 space-y-1 text-muted-foreground">
              <li>Tap <strong>Install app</strong> above, or</li>
              <li>Menu (⋮) → <strong>Install app</strong> or <strong>Add to Home screen</strong></li>
            </ol>
          </div>
          <p className="text-xs text-muted-foreground">
            Opens full-screen with no browser bar — matters, notes, Google Calendar, and Gmail only
            for bankruptcy.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
