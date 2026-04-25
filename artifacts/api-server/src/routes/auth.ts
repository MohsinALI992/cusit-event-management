import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { LoginAsBody } from "@workspace/api-zod";
import { getCurrentUserId, SESSION_COOKIE_NAME } from "../lib/session";
import { serializeUser } from "../lib/serializers";

const router: IRouter = Router();

router.get("/me", async (req, res) => {
  const uid = getCurrentUserId(req);
  if (!uid) {
    res.status(401).json({ error: "Not logged in" });
    return;
  }
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, uid));
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  res.json(serializeUser(user));
});

router.post("/auth/login", async (req, res) => {
  const parsed = LoginAsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, parsed.data.userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.cookie(SESSION_COOKIE_NAME, String(user.id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * 30,
  });
  res.json(serializeUser(user));
});

router.post("/auth/logout", (_req, res) => {
  res.clearCookie(SESSION_COOKIE_NAME, { path: "/" });
  res.status(204).end();
});

export default router;
