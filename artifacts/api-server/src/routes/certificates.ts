import { Router, type IRouter } from "express";
import {
  db,
  usersTable,
  eventsTable,
  registrationsTable,
  attendanceTable,
  certificatesTable,
  notificationsTable,
} from "@workspace/db";
import { eq, and, desc, inArray } from "drizzle-orm";
import { getCurrentUserId } from "../lib/session";
import { serializeEvent } from "../lib/serializers";

const router: IRouter = Router();

function makeCode(eventId: number, userId: number) {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `CUSIT-${eventId}-${userId}-${random}`;
}

router.post("/events/:id/certificates/issue", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  // Find all "present" attendees
  const presentRows = await db
    .select({ reg: registrationsTable, att: attendanceTable })
    .from(attendanceTable)
    .innerJoin(
      registrationsTable,
      eq(attendanceTable.registrationId, registrationsTable.id),
    )
    .where(
      and(
        eq(registrationsTable.eventId, id),
        inArray(attendanceTable.status, ["present", "late"]),
      ),
    );
  const [event] = await db
    .select()
    .from(eventsTable)
    .where(eq(eventsTable.id, id));
  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }
  let issuedCount = 0;
  for (const row of presentRows) {
    const [existing] = await db
      .select()
      .from(certificatesTable)
      .where(
        and(
          eq(certificatesTable.eventId, id),
          eq(certificatesTable.userId, row.reg.userId),
        ),
      );
    if (existing) continue;
    await db.insert(certificatesTable).values({
      eventId: id,
      userId: row.reg.userId,
      code: makeCode(id, row.reg.userId),
    });
    await db.insert(notificationsTable).values({
      userId: row.reg.userId,
      title: "Certificate issued",
      body: `Your certificate for "${event.title}" is ready to download.`,
      eventId: event.id,
    });
    issuedCount += 1;
  }
  // Mark event completed
  await db
    .update(eventsTable)
    .set({ status: "completed" })
    .where(eq(eventsTable.id, id));
  res.json({ issuedCount });
});

router.get("/me/certificates", async (req, res) => {
  const uid = getCurrentUserId(req);
  if (!uid) {
    res.status(401).json({ error: "Not logged in" });
    return;
  }
  const rows = await db
    .select({
      cert: certificatesTable,
      event: eventsTable,
      organizer: usersTable,
    })
    .from(certificatesTable)
    .innerJoin(eventsTable, eq(certificatesTable.eventId, eventsTable.id))
    .innerJoin(usersTable, eq(eventsTable.organizerId, usersTable.id))
    .where(eq(certificatesTable.userId, uid))
    .orderBy(desc(certificatesTable.issuedAt));
  res.json(
    rows.map((r) => ({
      id: r.cert.id,
      code: r.cert.code,
      issuedAt: r.cert.issuedAt.toISOString(),
      event: serializeEvent(
        r.event,
        { name: r.organizer.name, role: r.organizer.role },
        0,
      ),
    })),
  );
});

export default router;
