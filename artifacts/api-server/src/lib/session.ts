import type { Request } from "express";

const COOKIE_NAME = "uems_uid";

export function getCurrentUserId(req: Request): number | null {
  const cookies = (req as Request & { cookies?: Record<string, string> })
    .cookies;
  const raw = cookies?.[COOKIE_NAME];
  if (!raw) return null;
  const id = Number(raw);
  if (!Number.isFinite(id) || id <= 0) return null;
  return id;
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
