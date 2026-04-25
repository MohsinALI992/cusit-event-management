import { Router, type IRouter } from "express";
import {
  db,
  usersTable,
  eventsTable,
  registrationsTable,
  attendanceTable,
  certificatesTable,
  feedbackTable,
} from "@workspace/db";
import { and, count, desc, eq, gte, sql, avg } from "drizzle-orm";
import { serializeEvent } from "../lib/serializers";

const router: IRouter = Router();

router.get("/reports/dashboard", async (_req, res) => {
  const [{ totalEvents }] = await db
    .select({ totalEvents: count(eventsTable.id) })
    .from(eventsTable);
  const [{ upcomingEvents }] = await db
    .select({ upcomingEvents: count(eventsTable.id) })
    .from(eventsTable)
    .where(
      and(
        eq(eventsTable.status, "approved"),
        gte(eventsTable.startsAt, new Date()),
      ),
    );
  const [{ pendingApprovals }] = await db
    .select({ pendingApprovals: count(eventsTable.id) })
    .from(eventsTable)
    .where(eq(eventsTable.status, "pending"));
  const [{ totalRegistrations }] = await db
    .select({ totalRegistrations: count(registrationsTable.id) })
    .from(registrationsTable);
  const [{ totalCertificates }] = await db
    .select({ totalCertificates: count(certificatesTable.id) })
    .from(certificatesTable);
  const [{ activeUsers }] = await db
    .select({ activeUsers: count(usersTable.id) })
    .from(usersTable);
  const [avgRow] = await db
    .select({ avgFeedbackRating: avg(feedbackTable.rating) })
    .from(feedbackTable);
  res.json({
    totalEvents: Number(totalEvents),
    upcomingEvents: Number(upcomingEvents),
    pendingApprovals: Number(pendingApprovals),
    totalRegistrations: Number(totalRegistrations),
    totalCertificates: Number(totalCertificates),
    activeUsers: Number(activeUsers),
    avgFeedbackRating: avgRow?.avgFeedbackRating
      ? Number(avgRow.avgFeedbackRating)
      : 0,
  });
});

router.get("/reports/events-by-category", async (_req, res) => {
  const rows = await db
    .select({
      category: eventsTable.category,
      c: count(eventsTable.id),
    })
    .from(eventsTable)
    .groupBy(eventsTable.category);
  res.json(rows.map((r) => ({ category: r.category, count: Number(r.c) })));
});

router.get("/reports/registrations-trend", async (req, res) => {
  const days = Math.max(1, Math.min(60, Number(req.query.days) || 14));
  const since = new Date();
  since.setDate(since.getDate() - days + 1);
  since.setHours(0, 0, 0, 0);
  const rows = await db
    .select({
      day: sql<string>`to_char(${registrationsTable.registeredAt}::date, 'YYYY-MM-DD')`,
      c: count(registrationsTable.id),
    })
    .from(registrationsTable)
    .where(gte(registrationsTable.registeredAt, since))
    .groupBy(sql`${registrationsTable.registeredAt}::date`)
    .orderBy(sql`${registrationsTable.registeredAt}::date`);
  // Fill missing days with 0
  const map = new Map<string, number>();
  for (const r of rows) map.set(r.day, Number(r.c));
  const result: { date: string; count: number }[] = [];
  const cursor = new Date(since);
  for (let i = 0; i < days; i++) {
    const key = cursor.toISOString().slice(0, 10);
    result.push({ date: key, count: map.get(key) ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  res.json(result);
});

router.get("/reports/top-events", async (req, res) => {
  const limit = Math.max(1, Math.min(20, Number(req.query.limit) || 5));
  const rows = await db
    .select({
      eventId: eventsTable.id,
      title: eventsTable.title,
      category: eventsTable.category,
      registrationCount: count(registrationsTable.id),
    })
    .from(eventsTable)
    .leftJoin(
      registrationsTable,
      eq(registrationsTable.eventId, eventsTable.id),
    )
    .groupBy(eventsTable.id)
    .orderBy(desc(count(registrationsTable.id)))
    .limit(limit);

  // Compute attendance rate
  const result = [] as Array<{
    eventId: number;
    title: string;
    category: (typeof rows)[number]["category"];
    registrationCount: number;
    attendanceRate: number;
  }>;
  for (const r of rows) {
    const regCount = Number(r.registrationCount);
    if (regCount === 0) {
      result.push({
        eventId: r.eventId,
        title: r.title,
        category: r.category,
        registrationCount: 0,
        attendanceRate: 0,
      });
      continue;
    }
    const [attRow] = await db
      .select({ c: count(attendanceTable.id) })
      .from(attendanceTable)
      .innerJoin(
        registrationsTable,
        eq(attendanceTable.registrationId, registrationsTable.id),
      )
      .where(
        and(
          eq(registrationsTable.eventId, r.eventId),
          eq(attendanceTable.status, "present"),
        ),
      );
    result.push({
      eventId: r.eventId,
      title: r.title,
      category: r.category,
      registrationCount: regCount,
      attendanceRate: regCount > 0 ? Number(attRow!.c) / regCount : 0,
    });
  }
  res.json(result);
});

router.get("/reports/recent-activity", async (req, res) => {
  const limit = Math.max(1, Math.min(50, Number(req.query.limit) || 10));
  const items: Array<{
    type: string;
    message: string;
    eventId: number | null;
    timestamp: string;
  }> = [];

  const recentEvents = await db
    .select({ event: eventsTable, organizer: usersTable })
    .from(eventsTable)
    .innerJoin(usersTable, eq(eventsTable.organizerId, usersTable.id))
    .orderBy(desc(eventsTable.createdAt))
    .limit(limit);
  for (const r of recentEvents) {
    items.push({
      type:
        r.event.status === "approved"
          ? "event_approved"
          : r.event.status === "rejected"
            ? "event_rejected"
            : "event_created",
      message:
        r.event.status === "approved"
          ? `"${r.event.title}" was approved`
          : r.event.status === "rejected"
            ? `"${r.event.title}" was rejected`
            : `${r.organizer.name} proposed "${r.event.title}"`,
      eventId: r.event.id,
      timestamp: r.event.createdAt.toISOString(),
    });
  }

  const recentRegs = await db
    .select({ reg: registrationsTable, user: usersTable, event: eventsTable })
    .from(registrationsTable)
    .innerJoin(usersTable, eq(registrationsTable.userId, usersTable.id))
    .innerJoin(eventsTable, eq(registrationsTable.eventId, eventsTable.id))
    .orderBy(desc(registrationsTable.registeredAt))
    .limit(limit);
  for (const r of recentRegs) {
    items.push({
      type: "registration",
      message: `${r.user.name} registered for "${r.event.title}"`,
      eventId: r.event.id,
      timestamp: r.reg.registeredAt.toISOString(),
    });
  }

  const recentCerts = await db
    .select({ cert: certificatesTable, user: usersTable, event: eventsTable })
    .from(certificatesTable)
    .innerJoin(usersTable, eq(certificatesTable.userId, usersTable.id))
    .innerJoin(eventsTable, eq(certificatesTable.eventId, eventsTable.id))
    .orderBy(desc(certificatesTable.issuedAt))
    .limit(limit);
  for (const r of recentCerts) {
    items.push({
      type: "certificate",
      message: `Certificate issued to ${r.user.name} for "${r.event.title}"`,
      eventId: r.event.id,
      timestamp: r.cert.issuedAt.toISOString(),
    });
  }

  const recentFb = await db
    .select({ fb: feedbackTable, user: usersTable, event: eventsTable })
    .from(feedbackTable)
    .innerJoin(usersTable, eq(feedbackTable.userId, usersTable.id))
    .innerJoin(eventsTable, eq(feedbackTable.eventId, eventsTable.id))
    .orderBy(desc(feedbackTable.createdAt))
    .limit(limit);
  for (const r of recentFb) {
    items.push({
      type: "feedback",
      message: `${r.user.name} rated "${r.event.title}" ${r.fb.rating}/5`,
      eventId: r.event.id,
      timestamp: r.fb.createdAt.toISOString(),
    });
  }

  items.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
  res.json(items.slice(0, limit));
});

router.get("/reports/event/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [row] = await db
    .select({ event: eventsTable, organizer: usersTable })
    .from(eventsTable)
    .innerJoin(usersTable, eq(eventsTable.organizerId, usersTable.id))
    .where(eq(eventsTable.id, id));
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const [{ regCount }] = await db
    .select({ regCount: count(registrationsTable.id) })
    .from(registrationsTable)
    .where(eq(registrationsTable.eventId, id));
  const [{ attendedCount }] = await db
    .select({ attendedCount: count(attendanceTable.id) })
    .from(attendanceTable)
    .innerJoin(
      registrationsTable,
      eq(attendanceTable.registrationId, registrationsTable.id),
    )
    .where(
      and(
        eq(registrationsTable.eventId, id),
        eq(attendanceTable.status, "present"),
      ),
    );
  const [{ absentCount }] = await db
    .select({ absentCount: count(attendanceTable.id) })
    .from(attendanceTable)
    .innerJoin(
      registrationsTable,
      eq(attendanceTable.registrationId, registrationsTable.id),
    )
    .where(
      and(
        eq(registrationsTable.eventId, id),
        eq(attendanceTable.status, "absent"),
      ),
    );
  const [{ certificatesIssued }] = await db
    .select({ certificatesIssued: count(certificatesTable.id) })
    .from(certificatesTable)
    .where(eq(certificatesTable.eventId, id));
  const [avgRow] = await db
    .select({
      avgRating: avg(feedbackTable.rating),
      feedbackCount: count(feedbackTable.id),
    })
    .from(feedbackTable)
    .where(eq(feedbackTable.eventId, id));

  res.json({
    event: serializeEvent(
      row.event,
      { name: row.organizer.name, role: row.organizer.role },
      Number(regCount),
    ),
    registrationCount: Number(regCount),
    attendedCount: Number(attendedCount),
    absentCount: Number(absentCount),
    certificatesIssued: Number(certificatesIssued),
    avgRating: avgRow?.avgRating ? Number(avgRow.avgRating) : 0,
    feedbackCount: Number(avgRow?.feedbackCount ?? 0),
  });
});

export default router;
