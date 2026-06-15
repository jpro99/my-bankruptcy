export interface ExtractedIdentity {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  confidence: number;
  source: "filename" | "filename_weak" | "none";
}

export interface MatterForMatch {
  matterId: string;
  debtorDisplayName: string;
  clientFirstName?: string;
  clientLastName?: string;
}

export interface MatterMatchCandidate {
  matterId: string;
  debtorDisplayName: string;
  score: number;
  reasons: string[];
}

export interface UploadMatchPreview {
  action: "proceed" | "confirm";
  extracted: ExtractedIdentity;
  currentMatter: { matterId: string; debtorDisplayName: string };
  bestMatch?: MatterMatchCandidate;
  message?: string;
}

function capitalize(word: string): string {
  if (!word) return word;
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function nameTokens(s: string): string[] {
  return normalizeName(s).split(" ").filter(Boolean);
}

/** Names match if full normalized equal or first+last tokens align */
export function namesMatch(a: string, b: string): boolean {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb) return false;
  if (na === nb) return true;

  const ta = nameTokens(a);
  const tb = nameTokens(b);
  if (ta.length >= 2 && tb.length >= 2) {
    const aFirst = ta[0]!;
    const aLast = ta[ta.length - 1]!;
    const bFirst = tb[0]!;
    const bLast = tb[tb.length - 1]!;
    return (
      (aFirst === bFirst && aLast === bLast) ||
      (aFirst === bLast && aLast === bFirst)
    );
  }

  return na.includes(nb) || nb.includes(na);
}

const DOC_NOISE =
  /\b(drivers?|driver'?s?|license|lic|dl|id|card|scan|copy|front|back|img|photo|jpeg|jpg|png|pdf|upload|document)\b/gi;

/** Pull debtor name hints from filename (simulated ID OCR for Phase 1) */
export function extractIdentityFromDocument(
  fileName: string,
  documentType?: string
): ExtractedIdentity {
  const base = fileName.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();

  if (base.includes(",")) {
    const [lastPart, firstPart] = base.split(",").map((s) =>
      s.replace(DOC_NOISE, " ").replace(/\s+/g, " ").trim()
    );
    if (firstPart && lastPart) {
      const firstName = capitalize(firstPart.split(/\s+/)[0]!);
      const lastName = capitalize(lastPart.split(/\s+/)[0]!);
      return {
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
        confidence: 0.92,
        source: "filename",
      };
    }
  }

  const cleaned = base.replace(DOC_NOISE, " ").replace(/\s+/g, " ").trim();
  const tokens = cleaned.split(/\s+/).filter((t) => t.length > 1 && !/^\d+$/.test(t));

  if (tokens.length >= 2) {
    const firstName = capitalize(tokens[0]!);
    const lastName = capitalize(tokens.slice(1).join(" "));
    return {
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      confidence: 0.82,
      source: "filename",
    };
  }

  if (tokens.length === 1 && documentType === "drivers_license") {
    return {
      lastName: capitalize(tokens[0]!),
      confidence: 0.35,
      source: "filename_weak",
    };
  }

  return { confidence: 0, source: "none" };
}

export function findBestMatterMatch(
  matters: MatterForMatch[],
  identity: ExtractedIdentity,
  excludeMatterId?: string
): MatterMatchCandidate | undefined {
  if (identity.confidence < 0.5 || !identity.fullName) return undefined;

  const target = identity.fullName;
  let best: MatterMatchCandidate | undefined;

  for (const m of matters) {
    if (excludeMatterId && m.matterId === excludeMatterId) continue;

    const reasons: string[] = [];
    let score = 0;

    if (namesMatch(target, m.debtorDisplayName)) {
      reasons.push("debtor name");
      score += 0.9;
    }

    const alt =
      m.clientFirstName && m.clientLastName
        ? `${m.clientFirstName} ${m.clientLastName}`
        : undefined;
    if (alt && namesMatch(target, alt)) {
      reasons.push("client name on file");
      score += 0.95;
    }

    if (identity.firstName && identity.lastName) {
      const first = normalizeName(identity.firstName);
      const last = normalizeName(identity.lastName);
      const display = normalizeName(m.debtorDisplayName);
      if (display.includes(first) && display.includes(last)) {
        if (!reasons.length) reasons.push("name tokens");
        score = Math.max(score, 0.85);
      }
    }

    if (score > 0 && (!best || score > best.score)) {
      best = {
        matterId: m.matterId,
        debtorDisplayName: m.debtorDisplayName,
        score,
        reasons,
      };
    }
  }

  return best;
}

export function buildUploadMatchPreview(
  matters: MatterForMatch[],
  currentMatterId: string,
  fileName: string,
  documentType?: string
): UploadMatchPreview {
  const current = matters.find((m) => m.matterId === currentMatterId);
  const currentMatter = {
    matterId: currentMatterId,
    debtorDisplayName: current?.debtorDisplayName ?? currentMatterId,
  };

  const extracted = extractIdentityFromDocument(fileName, documentType);
  if (extracted.confidence < 0.5 || !extracted.fullName) {
    return { action: "proceed", extracted, currentMatter };
  }

  if (namesMatch(extracted.fullName, currentMatter.debtorDisplayName)) {
    return { action: "proceed", extracted, currentMatter };
  }

  const altCurrent =
    current?.clientFirstName && current?.clientLastName
      ? `${current.clientFirstName} ${current.clientLastName}`
      : undefined;
  if (altCurrent && namesMatch(extracted.fullName, altCurrent)) {
    return { action: "proceed", extracted, currentMatter };
  }

  const bestMatch = findBestMatterMatch(matters, extracted, currentMatterId);
  if (!bestMatch) {
    return { action: "proceed", extracted, currentMatter };
  }

  return {
    action: "confirm",
    extracted,
    currentMatter,
    bestMatch,
    message: `This looks like ${extracted.fullName}'s document — not ${currentMatter.debtorDisplayName}'s file.`,
  };
}
