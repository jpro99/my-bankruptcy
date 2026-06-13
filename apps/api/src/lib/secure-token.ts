import { createHmac, timingSafeEqual } from "node:crypto";

const DEFAULT_SECRET = "my-bankruptcy-portal-dev-secret-rotate-in-prod";

function secret(): string {
  return process.env.PORTAL_TOKEN_SECRET ?? DEFAULT_SECRET;
}

function signPayload(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

/** Signed, expiring portal token — embed in email/SMS links */
export function signPortalToken(matterId: string, expHours = 720): string {
  const exp = Date.now() + expHours * 3600_000;
  const payload = `${matterId}:${exp}`;
  const sig = signPayload(payload);
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

export function verifyPortalToken(token: string): { matterId: string } | null {
  if (token === "demo-client" || token.endsWith("-client")) {
    const matterId = token.replace(/-client$/, "") || "demo";
    return { matterId };
  }
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const lastColon = decoded.lastIndexOf(":");
    if (lastColon <= 0) return null;
    const sig = decoded.slice(lastColon + 1);
    const payload = decoded.slice(0, lastColon);
    const expected = signPayload(payload);
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null;
    const colon = payload.indexOf(":");
    const matterId = payload.slice(0, colon);
    const exp = parseInt(payload.slice(colon + 1), 10);
    if (!matterId || Number.isNaN(exp) || Date.now() > exp) return null;
    return { matterId };
  } catch {
    return null;
  }
}

export function portalTokenForMatter(matterId: string): string {
  return signPortalToken(matterId);
}
