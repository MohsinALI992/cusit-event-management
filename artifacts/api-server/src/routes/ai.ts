import { Router, type IRouter } from "express";
import { db, usersTable, eventsTable, registrationsTable, feedbackTable, attendanceTable } from "@workspace/db";
import { eq, ne, notInArray, and } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";
import { getCurrentUserId } from "../lib/session";

const router: IRouter = Router();

router.post("/ai/recommend-events", async (req, res) => {
  const uid = getCurrentUserId(req);
  if (!uid) { res.status(401).json({ error: "Not logged in" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, uid));
  if (!user) { res.status(401).json({ error: "User not found" }); return; }

  // Get events the user is already registered for
  const myRegs = await db.select({ eventId: registrationsTable.eventId }).from(registrationsTable).where(eq(registrationsTable.userId, uid));
  const registeredIds = myRegs.map((r) => r.eventId);

  // Get upcoming approved events the user hasn't registered for
  const now = new Date();
  let candidateEvents = await db.select().from(eventsTable).where(and(eq(eventsTable.status, "approved"), ne(eventsTable.organizerId, uid)));
  candidateEvents = candidateEvents.filter((e) => new Date(e.startsAt) > now && !registeredIds.includes(e.id));

  if (candidateEvents.length === 0) {
    res.json({ recommendations: [], reasoning: "No upcoming events available that you haven't already registered for." });
    return;
  }

  // Get user's past registrations with event info for preference data
  let pastContext = "";
  if (registeredIds.length > 0) {
    const pastEvents = await db.select().from(eventsTable).where(notInArray(eventsTable.id, candidateEvents.map((e) => e.id)));
    const myFeedback = await db.select().from(feedbackTable).where(eq(feedbackTable.userId, uid));
    const feedbackMap = new Map(myFeedback.map((f) => [f.eventId, f.rating]));
    pastContext = `Previously registered events:\n${pastEvents.slice(0, 10).map((e) => `- ${e.title} (${e.category})${feedbackMap.has(e.id) ? `, rating: ${feedbackMap.get(e.id)}/5` : ""}`).join("\n")}`;
  }

  const candidateList = candidateEvents.slice(0, 20).map((e) => `ID:${e.id} | ${e.title} | Category: ${e.category} | Venue: ${e.venue} | Date: ${new Date(e.startsAt).toLocaleDateString()}`).join("\n");

  const prompt = `You are an event recommendation engine for CUSIT Peshawar university portal.

User: ${user.name} (${user.role}${user.department ? `, ${user.department}` : ""})
${pastContext}

Upcoming events to choose from:
${candidateList}

Recommend the top 3 most relevant events for this user. For each, give a short reason why it suits them.
Also give a brief overall reasoning sentence.

Respond with ONLY valid JSON in this exact shape:
{
  "recommendations": [
    { "eventId": <number>, "title": "<string>", "reason": "<1-2 sentences>", "matchScore": <1-100> }
  ],
  "reasoning": "<1 sentence>"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.4",
      max_completion_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    res.json(parsed);
  } catch (err) {
    req.log.error({ err }, "AI recommendation error");
    res.status(500).json({ error: "AI recommendation failed" });
  }
});

router.post("/ai/generate-description", async (req, res) => {
  const uid = getCurrentUserId(req);
  if (!uid) { res.status(401).json({ error: "Not logged in" }); return; }

  const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
  const category = typeof req.body?.category === "string" ? req.body.category.trim() : "";
  const venue = typeof req.body?.venue === "string" ? req.body.venue.trim() : "";

  if (!title || !category) {
    res.status(400).json({ error: "title and category are required" });
    return;
  }

  const prompt = `Write a compelling, professional event description for the following CUSIT Peshawar university event:

Title: ${title}
Category: ${category}
${venue ? `Venue: ${venue}` : ""}

Write 2-3 engaging paragraphs (150-250 words total). Start directly with the description — no heading, no intro like "Here is...".
Use an enthusiastic but professional tone appropriate for a university event portal.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.4",
      max_completion_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });

    const description = response.choices[0]?.message?.content?.trim() ?? "";
    res.json({ description });
  } catch (err) {
    req.log.error({ err }, "AI description generation error");
    res.status(500).json({ error: "AI description generation failed" });
  }
});

export default router;
