import { InstallPrompt } from "@/components/mobile/install-prompt";
import { MobileMattersHeader, MobileMattersList } from "@/components/mobile/mobile-matters-list";
import { BRAND } from "@/lib/brand";

export default function MobileHomePage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <MobileMattersHeader />
      <p className="text-sm text-muted-foreground -mt-2">{BRAND.reliefPocket.tagline}</p>

      <InstallPrompt />

      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Pick a bankruptcy matter
        </h2>
        <MobileMattersList />
      </section>
    </div>
  );
}
