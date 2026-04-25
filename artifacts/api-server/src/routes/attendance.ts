import { Router, type IRouter } from "express";
import {
  db,
  usersTable,
  registrationsTable,
  attendanceTable,
} from "@workspace/db";
import { eq, asc, inArray } from "drizzle-orm";
import { MarkAttendanceBody } from "@workspace/api-zod";
import { serializeAttendanceRow } from "../lib/serializers";

const router: IRouter = Router();

router.get("/events/:id/attendance", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const rows = await db
    .select({ reg: registrationsTable, user: usersTable })
    .from(registrationsTable)
    .innerJoin(usersTable, eq(registrationsTable.userId, usersTable.id))
    .where(eq(registrationsTable.eventId, id))
    .orderBy(asc(usersTable.name));

  const regIds = rows.map((r) => r.reg.id);
  const atts = regIds.length
    ? await db
        .select()
        .from(attendanceTable)
        .where(inArray(attendanceTable.registrationId, regIds))
    : [];
  const attMap = new Map<number, (typeof atts)[number]>();
  for (const a of atts) attMap.set(a.registrationId, a);

  res.json(
    rows.map((r) =>
      serializeAttendanceRow(r.reg, r.user, attMap.get(r.reg.id) ?? null),
    ),
  );
});

router.post("/events/:id/attendance", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = MarkAttendanceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  for (const entry of parsed.data.entries) {
    const [reg] = await db
      .select()
      .from(registrationsTable)
      .where(eq(registrationsTable.id, entry.registrationId));
    if (!reg || reg.eventId !== id) continue;
    const [existing] = await db
      .select()
      .from(attendanceTable)
      .where(eq(attendanceTable.registrationId, entry.registrationId));
    if (existing) {
      await db
        .update(attendanceTable)
        .set({ status: entry.status, markedAt: new Date() })
        .where(eq(attendanceTable.registrationId, entry.registrationId));
    } else {
      await db.insert(attendanceTable).values({
        registrationId: entry.registrationId,
        status: entry.status,
        markedAt: new Date(),
      });
    }
  }
  // Return updated roster
  const rows = await db
    .select({ reg: registrationsTable, user: usersTable })
    .from(registrationsTable)
    .innerJoin(usersTable, eq(registrationsTable.userId, usersTable.id))
    .where(eq(registrationsTable.eventId, id))
    .orderBy(asc(usersTable.name));
  const regIds = rows.map((r) => r.reg.id);
  const atts = regIds.length
    ? await db
        .select()
        .from(attendanceTable)
        .where(inArray(attendanceTable.registrationId, regIds))
    : [];
  const attMap = new Map<number, (typeof atts)[number]>();
  for (const a of atts) attMap.set(a.registrationId, a);
  res.json(
    rows.map((r) =>
      serializeAttendanceRow(r.reg, r.user, attMap.get(r.reg.id) ?? null),
    ),
  );
});

export default router;
