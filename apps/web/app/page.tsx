import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Gauge,
  LayoutDashboard,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI extracts everything",
    description: "Drop paystubs, tax returns, and credit reports. AI maps fields to official forms.",
  },
  {
    icon: CheckCircle2,
    title: "You only approve",
    description: "Review confidence-scored fields one at a time. Bulk-approve high-confidence items.",
  },
  {
    icon: Zap,
    title: "God Button e-file",
    description: "247-rule preflight check, then one click to CACB CM/ECF sandbox filing.",
  },
  {
    icon: Shield,
    title: "Autopilot deadlines",
    description: "Post-petition tasks, 341 meeting, SOFA — tracked automatically after filing.",
  },
];

const STATS = [
  { label: "Ch 7 flat fee", value: "$2,500" },
  { label: "Ch 13 flat fee", value: "$4,000" },
  { label: "E-file", value: "1 click" },
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
          <span className="font-display text-lg font-bold tracking-tight">My Bankruptcy</span>
        </div>
        <Badge variant="secondary">California · CACB</Badge>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-20 pt-8 md:pt-16">
        <section className="animate-fade-in text-center">
          <Badge className="mb-6">Out of this world simple</Badge>
          <h1 className="font-display text-4xl font-extrabold tracking-tight md:text-6xl md:leading-[1.1]">
            The easiest bankruptcies
            <br />
            <span className="text-gradient">an attorney will ever file</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Drop documents → approve AI fields → one-click e-file → autopilot the rest.
            Built for California Chapter 7 &amp; 13 practice.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="min-w-[220px] shadow-glow">
              <Link href="/matters/demo/command">
                <LayoutDashboard />
                Command Center
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg" className="min-w-[220px]">
              <Link href="/matters/demo/cockpit">
                <Gauge />
                Matter Cockpit
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
                <p className="mt-1 font-display text-2xl font-bold text-primary">{stat.value}</p>
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
            <Link href="/matters/demo/intake">Start intake →</Link>
          </Button>
          <span className="text-muted-foreground">·</span>
          <Button asChild variant="link">
            <Link href="/portal/demo-client">Client portal demo →</Link>
          </Button>
        </section>
      </main>
    </div>
  );
}
