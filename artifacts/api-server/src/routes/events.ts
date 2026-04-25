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
import { and, desc, eq, gte, ilike, count, inArray, type SQL } from "drizzle-orm";
import {
  ListEventsQueryParams,
  CreateEventBody,
  UpdateEventBody,
  ApproveEventBody,
  GetEventParams,
} from "@workspace/api-zod";
import { getCurrentUserId } from "../lib/session";
import {
  serializeEvent,
  serializeUser,
} from "../lib/serializers";

const router: IRouter = Router();

async function getRegistrationCounts(
  eventIds: number[],
): Promise<Map<number, number>> {
  if (eventIds.length === 0) return new Map();
  const rows = await db
    .select({
      eventId: registrationsTable.eventId,
      c: count(registrationsTable.id),
    })
    .from(registrationsTable)
    .where(inArray(registrationsTable.eventId, eventIds))
    .groupBy(registrationsTable.eventId);
  const map = new Map<number, number>();
  for (const r of rows) map.set(r.eventId, Number(r.c));
  return map;
}

router.get("/events", async (req, res) => {
  const parsed = ListEventsQueryParams.safeParse(req.query);
  const filters = parsed.success ? parsed.data : {};
  const conds: SQL[] = [];
  if (filters.status) conds.push(eq(eventsTable.status, filters.status));
  if (filters.category)
    conds.push(
      eq(
        eventsTable.category,
        filters.category as (typeof eventsTable.category.enumValues)[number],
      ),
    );
  if (filters.organizerId)
    conds.push(eq(eventsTable.organizerId, filters.organizerId));
  if (filters.upcoming) conds.push(gte(eventsTable.startsAt, new Date()));
  if (filters.search)
    conds.push(ilike(eventsTable.title, `%${filters.search}%`));

  const where = conds.length > 0 ? and(...conds) : undefined;

  const rows = await db
    .select({
      event: eventsTable,
      organizer: usersTable,
    })
    .from(eventsTable)
    .innerJoin(usersTable, eq(eventsTable.organizerId, usersTable.id))
    .where(where)
    .orderBy(desc(eventsTable.startsAt));

  const counts = await getRegistrationCounts(rows.map((r) => r.event.id));
  res.json(
    rows.map((r) =>
      serializeEvent(
        r.event,
        { name: r.organizer.name, role: r.organizer.role },
        counts.get(r.event.id) ?? 0,
      ),
    ),
  );
});

router.post("/events", async (req, res) => {
  const uid = getCurrentUserId(req);
  if (!uid) {
    res.status(401).json({ error: "Not logged in" });
    return;
  }
  const parsed = CreateEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body", details: parsed.error.issues });
    return;
  }
  const [creator] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, uid));
  if (!creator) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  const isAutoApproved = creator.role === "admin";
  const [created] = await db
    .insert(eventsTable)
    .values({
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      startsAt: new Date(parsed.data.startsAt),
      endsAt: new Date(parsed.data.endsAt),
      venue: parsed.data.venue,
      capacity: parsed.data.capacity,
      bannerUrl: parsed.data.bannerUrl ?? null,
      organizerId: uid,
      status: isAutoApproved ? "approved" : "pending",
    })
    .returning();
  if (!created) {
    res.status(500).json({ error: "Failed to create event" });
    return;
  }

  const approvers = await db
    .select()
    .from(usersTable)
    .where(inArray(usersTable.role, ["faculty", "coordinator", "admin"]));
  if (approvers.length > 0) {
    await db.insert(notificationsTable).values(
      approvers.map((a) => ({
        userId: a.id,
        title: "New event proposal",
        body: `${creator.name} proposed "${created.title}" — pending approval.`,
        eventId: created.id,
      })),
    );
  }
  res
    .status(201)
    .json(serializeEvent(created, { name: creator.name, role: creator.role }, 0));
});

router.get("/events/:id", async (req, res) => {
  const parsed = GetEventParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const id = parsed.data.id;
  const [row] = await db
    .select({ event: eventsTable, organizer: usersTable })
    .from(eventsTable)
    .innerJoin(usersTable, eq(eventsTable.organizerId, usersTable.id))
    .where(eq(eventsTable.id, id));
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const [{ c: regCount }] = await db
    .select({ c: count(registrationsTable.id) })
    .from(registrationsTable)
    .where(eq(registrationsTable.eventId, id));
  const base = serializeEvent(
    row.event,
    { name: row.organizer.name, role: row.organizer.role },
    Number(regCount),
  );
  const uid = getCurrentUserId(req);
  let isRegistered = false;
  let myAttendanceStatus: "absent" | "present" | "late" | undefined;
  let hasCertificate = false;
  if (uid) {
    const [reg] = await db
      .select()
      .from(registrationsTable)
      .where(
        and(
          eq(registrationsTable.eventId, id),
          eq(registrationsTable.userId, uid),
        ),
      );
    if (reg) {
      isRegistered = true;
      const [att] = await db
        .select()
        .from(attendanceTable)
        .where(eq(attendanceTable.registrationId, reg.id));
      if (att) myAttendanceStatus = att.status;
    }
    const [cert] = await db
      .select()
      .from(certificatesTable)
      .where(
        and(
          eq(certificatesTable.eventId, id),
          eq(certificatesTable.userId, uid),
        ),
      );
    hasCertificate = !!cert;
  }
  res.json({
    ...base,
    isRegistered,
    myAttendanceStatus,
    hasCertificate,
  });
});

router.patch("/events/:id", async (req, res) => {
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
  const parsed = UpdateEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const updates: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v === undefined) continue;
    if (k === "startsAt" || k === "endsAt") {
      updates[k] = new Date(v as string);
    } else {
      updates[k] = v;
    }
  }
  const [updated] = await db
    .update(eventsTable)
    .set(updates)
    .where(eq(eventsTable.id, id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const [organizer] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, updated.organizerId));
  const [{ c }] = await db
    .select({ c: count(registrationsTable.id) })
    .from(registrationsTable)
    .where(eq(registrationsTable.eventId, id));
  res.json(
    serializeEvent(
      updated,
      organizer
        ? { name: organizer.name, role: organizer.role }
        : { name: "Unknown", role: "admin" },
      Number(c),
    ),
  );
});

router.delete("/events/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(eventsTable).where(eq(eventsTable.id, id));
  res.status(204).end();
});

router.post("/events/:id/approve", async (req, res) => {
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
  const parsed = ApproveEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const newStatus = parsed.data.decision === "approve" ? "approved" : "rejected";
  const [updated] = await db
    .update(eventsTable)
    .set({
      status: newStatus,
      rejectionReason:
        newStatus === "rejected" ? parsed.data.rejectionReason ?? null : null,
    })
    .where(eq(eventsTable.id, id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const [organizer] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, updated.organizerId));

  // Notify organizer
  if (organizer) {
    await db.insert(notificationsTable).values({
      userId: organizer.id,
      title:
        newStatus === "approved"
          ? "Your event was approved"
          : "Your event was rejected",
      body:
        newStatus === "approved"
          ? `"${updated.title}" is now live and open for registrations.`
          : `"${updated.title}" was rejected. ${parsed.data.rejectionReason ?? ""}`,
      eventId: updated.id,
    });

    // If approved, broadcast to all students
    if (newStatus === "approved") {
      const students = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.role, "student"));
      if (students.length > 0) {
        await db.insert(notificationsTable).values(
          students.map((s) => ({
            userId: s.id,
            title: "New event open for registration",
            body: `"${updated.title}" — ${new Date(updated.startsAt).toLocaleDateString()} at ${updated.venue}.`,
            eventId: updated.id,
          })),
        );
      }
    }
  }

  const [{ c }] = await db
    .select({ c: count(registrationsTable.id) })
    .from(registrationsTable)
    .where(eq(registrationsTable.eventId, id));
  res.json(
    serializeEvent(
      updated,
      organizer
        ? { name: organizer.name, role: organizer.role }
        : { name: "Unknown", role: "admin" },
      Number(c),
    ),
  );
});

export default router;
