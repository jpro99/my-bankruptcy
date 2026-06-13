import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Hammer,
  LayoutDashboard,
  Shield,
  Sparkles,
} from "lucide-react";
import { BRAND } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI extracts everything",
    description: "Drop paystubs, tax returns, credit. AI maps every field to official forms.",
  },
  {
    icon: Hammer,
    title: BRAND.forge.name,
    description: BRAND.forge.description,
  },
  {
    icon: Shield,
    title: BRAND.gavel.name,
    description: `${BRAND.sealCheck.name} → ${BRAND.gavel.action.toLowerCase()} to CM/ECF.`,
  },
  {
    icon: CheckCircle2,
    title: BRAND.continuum.name,
    description: BRAND.continuum.description,
  },
];

const STATS = [
  { label: "Ch 7 flat fee", value: "$2,500" },
  { label: "Ch 13 flat fee", value: "$4,000" },
  { label: "E-file", value: "The Gavel" },
  { label: "Your work", value: "Approve" },
];

export default function HomePage() {
  return (
    <div className="mesh-hero min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary shadow-glow">
            <span className="text-sm font-black text-white">MB</span>
          </div>
          <span className="font-display text-lg font-bold tracking-tight">{BRAND.name}</span>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="secondary" size="sm">
            <Link href="/signup">Attorney signup</Link>
          </Button>
          <Badge variant="secondary">California · CACB</Badge>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-20 pt-8 md:pt-16">
        <section className="animate-fade-in text-center">
          <Badge className="mb-6">{BRAND.shortTag}</Badge>
          <h1 className="font-display text-4xl font-extrabold tracking-tight md:text-6xl md:leading-[1.1]">
            The fastest relief
            <br />
            <span className="text-gradient">an attorney will ever file</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Document Drop → {BRAND.forge.name} → {BRAND.gavel.name} → {BRAND.continuum.name}.
            Counseling Bridge, Trust Ledger receipts, encrypted Client Vault — end to end.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="min-w-[220px] shadow-glow">
              <Link href="/signup">
                Start free — attorney signup
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg" className="min-w-[220px]">
              <Link href="/matters/demo/command">
                <LayoutDashboard />
                {BRAND.command.name}
              </Link>
            </Button>
          </div>
        </section>

        <section className="mt-16 grid grid-cols-2 gap-3 md:grid-cols-4 animate-fade-in">
          {STATS.map((stat) => (
            <Card key={stat.label} className="text-center">
              <CardContent className="p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {stat.label}
                </p>
                <p className="mt-1 font-display text-xl font-bold text-primary">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="mt-20 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                className="group transition hover:border-primary/30 hover:shadow-elevated"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <CardContent className="p-6">
                  <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-primary-muted text-primary transition group-hover:bg-primary group-hover:text-white">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="mt-16 flex flex-wrap items-center justify-center gap-4 text-sm">
          <Button asChild variant="link">
            <Link href="/matters/demo/intake">Document Drop →</Link>
          </Button>
          <span className="text-muted-foreground">·</span>
          <Button asChild variant="link">
            <Link href="/portal/demo-client">Client Vault demo →</Link>
          </Button>
        </section>
      </main>
    </div>
  );
}
