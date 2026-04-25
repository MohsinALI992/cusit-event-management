import { Router, type IRouter } from "express";
import { db, notificationsTable } from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";
import { getCurrentUserId } from "../lib/session";
import { serializeNotification } from "../lib/serializers";

const router: IRouter = Router();

router.get("/me/notifications", async (req, res) => {
  const uid = getCurrentUserId(req);
  if (!uid) {
    res.status(401).json({ error: "Not logged in" });
    return;
  }
  const rows = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, uid))
    .orderBy(desc(notificationsTable.createdAt));
  res.json(rows.map(serializeNotification));
});

router.post("/me/notifications/:id/read", async (req, res) => {
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
    .update(notificationsTable)
    .set({ isRead: 1 })
    .where(
      and(eq(notificationsTable.id, id), eq(notificationsTable.userId, uid)),
    );
  res.status(204).end();
});

export default router;
