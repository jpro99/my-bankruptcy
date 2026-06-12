import { z } from "zod";

export * from "./dev-session.js";

export const SessionContextSchema = z.object({
  userId: z.string(),
  clerkUserId: z.string(),
  firmId: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(["attorney", "paralegal", "admin"]),
});

export type SessionContext = z.infer<typeof SessionContextSchema>;

export interface AuthConfig {
  clerkSecretKey: string;
}

export function parseSessionFromHeaders(
  headers: Headers
): SessionContext | null {
  const firmId = headers.get("x-firm-id");
  const userId = headers.get("x-user-id");
  const clerkUserId = headers.get("x-clerk-user-id");
  const email = headers.get("x-user-email");
  const role = headers.get("x-user-role");

  if (!firmId || !userId || !clerkUserId || !email || !role) {
    return null;
  }

  const result = SessionContextSchema.safeParse({
    userId,
    clerkUserId,
    firmId,
    email,
    role,
  });

  return result.success ? result.data : null;
}

export function assertFirmAccess(
  session: SessionContext,
  resourceFirmId: string
): void {
  if (session.firmId !== resourceFirmId) {
    throw new AuthError("Forbidden: firm access denied", 403);
  }
}

export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "AuthError";
  }
}
