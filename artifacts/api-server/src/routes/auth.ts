import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db, usersTable, passwordResetTokensTable } from "@workspace/db";
import { eq, and, gt, isNull } from "drizzle-orm";
import { RegisterBody } from "@workspace/api-zod";
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
  const body = req.body as Record<string, unknown>;

  // Demo login: { userId: number }
  if (typeof body["userId"] === "number") {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, body["userId"] as number));
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
    return;
  }

  // Real login: { email, password }
  const email = typeof body["email"] === "string" ? body["email"].trim().toLowerCase() : null;
  const password = typeof body["password"] === "string" ? body["password"] : null;

  if (!email || !password) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));

  if (!user || !user.passwordHash) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
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

router.post("/auth/register", async (req, res) => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid registration data", details: parsed.error.flatten() });
    return;
  }

  const { name, email, password, role, department, registrationNumber } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();

  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, normalizedEmail));

  if (existing) {
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const [newUser] = await db
    .insert(usersTable)
    .values({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role,
      department: department?.trim() || null,
      registrationNumber: registrationNumber?.trim() || null,
    })
    .returning();

  if (!newUser) {
    res.status(500).json({ error: "Failed to create account" });
    return;
  }

  res.cookie(SESSION_COOKIE_NAME, String(newUser.id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * 30,
  });
  res.status(201).json(serializeUser(newUser));
});

router.post("/auth/forgot-password", async (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : null;
  if (!email) {
    res.status(400).json({ error: "email is required" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user) {
    res.status(404).json({ error: "No account found with that email address" });
    return;
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

  await db.insert(passwordResetTokensTable).values({ userId: user.id, token, expiresAt });

  res.json({
    message: "Reset token generated. Use it on the reset-password page.",
    token,
  });
});

router.post("/auth/reset-password", async (req, res) => {
  const token = typeof req.body?.token === "string" ? req.body.token.trim() : null;
  const password = typeof req.body?.password === "string" ? req.body.password : null;

  if (!token || !password) {
    res.status(400).json({ error: "token and password are required" });
    return;
  }

  const now = new Date();
  const [resetRow] = await db
    .select()
    .from(passwordResetTokensTable)
    .where(
      and(
        eq(passwordResetTokensTable.token, token),
        gt(passwordResetTokensTable.expiresAt, now),
        isNull(passwordResetTokensTable.usedAt),
      ),
    );

  if (!resetRow) {
    res.status(400).json({ error: "This reset link is invalid or has expired" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db
    .update(usersTable)
    .set({ passwordHash })
    .where(eq(usersTable.id, resetRow.userId));

  await db
    .update(passwordResetTokensTable)
    .set({ usedAt: now })
    .where(eq(passwordResetTokensTable.id, resetRow.id));

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, resetRow.userId));
  if (!user) {
    res.status(500).json({ error: "User not found after reset" });
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
