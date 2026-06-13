"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Scale, Shield } from "lucide-react";
import { fetchAgreement, signupFirm } from "@/lib/api-client";
import { BRAND } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function SignupForm() {
  const router = useRouter();
  const [agreement, setAgreement] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [form, setForm] = useState({
    firmName: "",
    attorneyFirstName: "",
    attorneyLastName: "",
    email: "",
    phone: "",
    counselingTier: "relay" as "gold" | "relay" | "vault",
    counselingProvider: "debtorcc" as "debtorcc" | "bkcert" | "advantagecc" | "creditorg",
  });

  useEffect(() => {
    void fetchAgreement().then((a) => setAgreement(a.text)).catch(() => setAgreement(""));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accepted) {
      setError("Please accept the attorney agreement");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await signupFirm({ ...form, agreementAccepted: true });
      router.push(res.demoMatterUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mesh-hero min-h-screen px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-8">
        <header className="text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary shadow-glow">
            <Scale className="size-7 text-white" />
          </div>
          <Badge className="mb-3">Attorney onboarding</Badge>
          <h1 className="font-display text-3xl font-bold">Start with {BRAND.name}</h1>
          <p className="mt-2 text-muted-foreground">{BRAND.tagline}</p>
        </header>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
          <Card>
            <CardContent className="space-y-4 p-6">
              <h2 className="font-semibold">Your firm</h2>
              <Input
                placeholder="Law firm name"
                value={form.firmName}
                onChange={(e) => setForm({ ...form, firmName: e.target.value })}
                required
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  placeholder="Attorney first name"
                  value={form.attorneyFirstName}
                  onChange={(e) => setForm({ ...form, attorneyFirstName: e.target.value })}
                  required
                />
                <Input
                  placeholder="Attorney last name"
                  value={form.attorneyLastName}
                  onChange={(e) => setForm({ ...form, attorneyLastName: e.target.value })}
                  required
                />
              </div>
              <Input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <Input
                placeholder="Phone (optional)"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-6">
              <h2 className="font-semibold">{BRAND.counseling.name}</h2>
              <p className="text-sm text-muted-foreground">{BRAND.counseling.description}</p>
              <div className="grid gap-2">
                {(Object.keys(BRAND.counseling.tiers) as Array<keyof typeof BRAND.counseling.tiers>).map(
                  (tier) => (
                    <label
                      key={tier}
                      className={`flex cursor-pointer gap-3 rounded-lg border p-3 ${
                        form.counselingTier === tier ? "border-primary bg-primary-muted/40" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="tier"
                        checked={form.counselingTier === tier}
                        onChange={() => setForm({ ...form, counselingTier: tier })}
                      />
                      <div>
                        <p className="text-sm font-semibold">{BRAND.counseling.tiers[tier].label}</p>
                        <p className="text-xs text-muted-foreground">
                          {BRAND.counseling.tiers[tier].description}
                        </p>
                      </div>
                    </label>
                  )
                )}
              </div>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.counselingProvider}
                onChange={(e) =>
                  setForm({
                    ...form,
                    counselingProvider: e.target.value as typeof form.counselingProvider,
                  })
                }
              >
                {Object.entries(BRAND.counseling.providers).map(([key, p]) => (
                  <option key={key} value={key}>
                    {p.name}
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center gap-2">
                <Shield className="size-4 text-primary" />
                <h2 className="font-semibold">Attorney agreement</h2>
              </div>
              <pre className="max-h-40 overflow-y-auto rounded-lg bg-muted p-3 text-xs whitespace-pre-wrap">
                {agreement || "Loading agreement…"}
              </pre>
              <label className="flex cursor-pointer items-start gap-2 text-sm">
                <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
                I am a licensed attorney (or authorized staff) and accept this agreement
              </label>
            </CardContent>
          </Card>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : <ArrowRight />}
            Create firm & enter Relief Command
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already exploring?{" "}
          <Link href="/matters/demo/command" className="text-primary underline">
            Open demo matter
          </Link>
        </p>
      </div>
    </div>
  );
}
