import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { ListUsersQueryParams } from "@workspace/api-zod";
import { serializeUser } from "../lib/serializers";

const router: IRouter = Router();

router.get("/users", async (req, res) => {
  const parsed = ListUsersQueryParams.safeParse(req.query);
  const role = parsed.success ? parsed.data.role : undefined;
  const rows = role
    ? await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.role, role))
        .orderBy(asc(usersTable.name))
    : await db.select().from(usersTable).orderBy(asc(usersTable.name));
  res.json(rows.map(serializeUser));
});

export default router;
