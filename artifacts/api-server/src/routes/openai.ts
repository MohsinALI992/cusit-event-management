import { Router, type IRouter } from "express";
import { db, conversations, messages } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";
import { getCurrentUserId } from "../lib/session";

const router: IRouter = Router();

router.get("/openai/conversations", async (req, res) => {
  const uid = getCurrentUserId(req);
  if (!uid) { res.status(401).json({ error: "Not logged in" }); return; }

  const rows = await db.select().from(conversations).orderBy(asc(conversations.createdAt));
  res.json(rows.map((c) => ({ id: c.id, title: c.title, createdAt: c.createdAt })));
});

router.post("/openai/conversations", async (req, res) => {
  const uid = getCurrentUserId(req);
  if (!uid) { res.status(401).json({ error: "Not logged in" }); return; }

  const title = typeof req.body?.title === "string" ? req.body.title.trim() : "New Conversation";
  const [conv] = await db.insert(conversations).values({ title }).returning();
  res.status(201).json({ id: conv!.id, title: conv!.title, createdAt: conv!.createdAt });
});

router.get("/openai/conversations/:id/messages", async (req, res) => {
  const uid = getCurrentUserId(req);
  if (!uid) { res.status(401).json({ error: "Not logged in" }); return; }

  const id = Number(req.params["id"]);
  const rows = await db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(asc(messages.createdAt));
  res.json(rows.map((m) => ({ id: m.id, conversationId: m.conversationId, role: m.role, content: m.content, createdAt: m.createdAt })));
});

router.post("/openai/conversations/:id/messages", async (req, res) => {
  const uid = getCurrentUserId(req);
  if (!uid) { res.status(401).json({ error: "Not logged in" }); return; }

  const id = Number(req.params["id"]);
  const userContent = typeof req.body?.content === "string" ? req.body.content.trim() : "";
  if (!userContent) { res.status(400).json({ error: "content is required" }); return; }

  await db.insert(messages).values({ conversationId: id, role: "user", content: userContent });

  const history = await db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(asc(messages.createdAt));

  const systemPrompt = `You are the CUSIT Peshawar Event Management System assistant. 
You help students, faculty, and staff navigate the university event portal.
You can answer questions about upcoming events, how to register, how attendance works, 
how certificates are issued, how feedback is submitted, and how proposals are approved.
Be concise, friendly, and helpful. If asked about specific event data you don't have access to,
tell the user to check the Events section of the portal.`;

  const chatMessages = [
    { role: "system" as const, content: systemPrompt },
    ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
  ];

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let fullResponse = "";
  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-5.4",
      max_completion_tokens: 8192,
      messages: chatMessages,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullResponse += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    await db.insert(messages).values({ conversationId: id, role: "assistant", content: fullResponse });
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  } catch (err) {
    req.log.error({ err }, "OpenAI stream error");
    res.write(`data: ${JSON.stringify({ error: "AI request failed" })}\n\n`);
  }
  res.end();
});

router.delete("/openai/conversations/:id", async (req, res) => {
  const uid = getCurrentUserId(req);
  if (!uid) { res.status(401).json({ error: "Not logged in" }); return; }

  const id = Number(req.params["id"]);
  await db.delete(conversations).where(eq(conversations.id, id));
  res.status(204).end();
});

export default router;
