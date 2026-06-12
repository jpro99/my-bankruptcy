import { z } from "zod";
import type { SessionContext } from "./index.js";
import { SessionContextSchema } from "./index.js";

export const DEV_SESSION: SessionContext = {
  userId: "00000000-0000-0000-0000-000000000001",
  clerkUserId: "dev_clerk_user",
  firmId: "00000000-0000-0000-0000-000000000010",
  email: "attorney@chapterai.dev",
  role: "attorney",
};

export const DEMO_MATTER_ID = "demo";

export function resolveSession(headers: Headers): SessionContext | null {
  const firmId = headers.get("x-firm-id");
  const userId = headers.get("x-user-id");
  const clerkUserId = headers.get("x-clerk-user-id");
  const email = headers.get("x-user-email");
  const role = headers.get("x-user-role");

  if (firmId && userId && clerkUserId && email && role) {
    const result = SessionContextSchema.safeParse({
      userId,
      clerkUserId,
      firmId,
      email,
      role,
    });
    if (result.success) return result.data;
  }

  if (process.env.DEV_AUTH_BYPASS === "1") {
    return DEV_SESSION;
  }

  return null;
}
