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
import { and, desc, eq, count } from "drizzle-orm";
import { getCurrentUserId } from "../lib/session";
import {
  serializeRegistration,
  serializeEvent,
} from "../lib/serializers";

const router: IRouter = Router();

router.get("/events/:id/registrations", async (req, res) => {
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
    .orderBy(desc(registrationsTable.registeredAt));
  res.json(rows.map((r) => serializeRegistration(r.reg, r.user)));
});

router.post("/events/:id/register", async (req, res) => {
  const uid = getCurrentUserId(req);
  if (!uid) {
    res.status(401).json({ error: "Not logged in" });
    return;
  }
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [event] = await db
    .select()
    .from(eventsTable)
    .where(eq(eventsTable.id, id));
  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }
  if (event.status !== "approved" && event.status !== "completed") {
    res.status(400).json({ error: "Event is not open for registration" });
    return;
  }
  const [{ c }] = await db
    .select({ c: count(registrationsTable.id) })
    .from(registrationsTable)
    .where(eq(registrationsTable.eventId, id));
  if (Number(c) >= event.capacity) {
    res.status(400).json({ error: "Event is full" });
    return;
  }
  const [existing] = await db
    .select()
    .from(registrationsTable)
    .where(
      and(
        eq(registrationsTable.eventId, id),
        eq(registrationsTable.userId, uid),
      ),
    );
  if (existing) {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, uid));
    res.status(200).json(serializeRegistration(existing, user!));
    return;
  }
  const [created] = await db
    .insert(registrationsTable)
    .values({ eventId: id, userId: uid })
    .returning();
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, uid));
  // Notify the user
  await db.insert(notificationsTable).values({
    userId: uid,
    title: "Registration confirmed",
    body: `You're registered for "${event.title}" on ${new Date(event.startsAt).toLocaleDateString()}.`,
    eventId: event.id,
  });
  res.status(201).json(serializeRegistration(created!, user!));
});

router.post("/events/:id/unregister", async (req, res) => {
  const uid = getCurrentUserId(req);
  if (!uid) {
    res.status(401).json({ error: "Not logged in" });
    return;
  }
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db
    .delete(registrationsTable)
    .where(
      and(
        eq(registrationsTable.eventId, id),
        eq(registrationsTable.userId, uid),
      ),
    );
  res.status(204).end();
});

router.get("/me/registrations", async (req, res) => {
  const uid = getCurrentUserId(req);
  if (!uid) {
    res.status(401).json({ error: "Not logged in" });
    return;
  }
  const rows = await db
    .select({
      reg: registrationsTable,
      event: eventsTable,
      organizer: usersTable,
    })
    .from(registrationsTable)
    .innerJoin(eventsTable, eq(registrationsTable.eventId, eventsTable.id))
    .innerJoin(usersTable, eq(eventsTable.organizerId, usersTable.id))
    .where(eq(registrationsTable.userId, uid))
    .orderBy(desc(eventsTable.startsAt));

  // Get attendance per registration
  const regIds = rows.map((r) => r.reg.id);
  const attMap = new Map<number, "absent" | "present" | "late">();
  if (regIds.length > 0) {
    const atts = await db
      .select()
      .from(attendanceTable);
    for (const a of atts) {
      if (regIds.includes(a.registrationId)) attMap.set(a.registrationId, a.status);
    }
  }
  // Certificates
  const certRows = await db
    .select()
    .from(certificatesTable)
    .where(eq(certificatesTable.userId, uid));
  const certEventIds = new Set(certRows.map((c) => c.eventId));

  // Counts
  const counts = await db
    .select({
      eventId: registrationsTable.eventId,
      c: count(registrationsTable.id),
    })
    .from(registrationsTable)
    .groupBy(registrationsTable.eventId);
  const countMap = new Map<number, number>();
  for (const c of counts) countMap.set(c.eventId, Number(c.c));

  res.json(
    rows.map((r) => ({
      id: r.reg.id,
      registeredAt: r.reg.registeredAt.toISOString(),
      attendanceStatus: attMap.get(r.reg.id) ?? "absent",
      hasCertificate: certEventIds.has(r.event.id),
      event: serializeEvent(
        r.event,
        { name: r.organizer.name, role: r.organizer.role },
        countMap.get(r.event.id) ?? 0,
      ),
    })),
  );
});

export default router;
