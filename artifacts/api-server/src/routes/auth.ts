import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
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

router.post("/auth/logout", (_req, res) => {
  res.clearCookie(SESSION_COOKIE_NAME, { path: "/" });
  res.status(204).end();
});

export default router;
