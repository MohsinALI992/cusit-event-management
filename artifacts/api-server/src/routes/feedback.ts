import { Router, type IRouter } from "express";
import { db, usersTable, feedbackTable } from "@workspace/db";
import { desc, eq, and } from "drizzle-orm";
import { SubmitFeedbackBody } from "@workspace/api-zod";
import { getCurrentUserId } from "../lib/session";
import { serializeFeedback } from "../lib/serializers";

const router: IRouter = Router();

router.get("/events/:id/feedback", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const rows = await db
    .select({ fb: feedbackTable, user: usersTable })
    .from(feedbackTable)
    .innerJoin(usersTable, eq(feedbackTable.userId, usersTable.id))
    .where(eq(feedbackTable.eventId, id))
    .orderBy(desc(feedbackTable.createdAt));
  res.json(rows.map((r) => serializeFeedback(r.fb, r.user)));
});

router.post("/events/:id/feedback", async (req, res) => {
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
  const parsed = SubmitFeedbackBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const [existing] = await db
    .select()
    .from(feedbackTable)
    .where(and(eq(feedbackTable.eventId, id), eq(feedbackTable.userId, uid)));
  let row;
  if (existing) {
    [row] = await db
      .update(feedbackTable)
      .set({
        rating: parsed.data.rating,
        comment: parsed.data.comment ?? null,
      })
      .where(eq(feedbackTable.id, existing.id))
      .returning();
  } else {
    [row] = await db
      .insert(feedbackTable)
      .values({
        eventId: id,
        userId: uid,
        rating: parsed.data.rating,
        comment: parsed.data.comment ?? null,
      })
      .returning();
  }
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, uid));
  res.status(201).json(serializeFeedback(row!, user!));
});

export default router;
