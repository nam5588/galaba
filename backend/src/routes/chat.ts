import { Router } from "express";
import { chat, type ChatTurn } from "../chat/orchestrator.js";

export const chatRouter = Router();

// POST /api/chat  { messages: [{ role: "user" | "assistant", content: string }] }
chatRouter.post("/", async (req, res) => {
  const raw: unknown = req.body?.messages;
  const messages: ChatTurn[] = Array.isArray(raw)
    ? raw
        .filter(
          (m): m is ChatTurn =>
            !!m &&
            (m.role === "user" || m.role === "assistant") &&
            typeof m.content === "string" &&
            m.content.trim() !== "",
        )
        .slice(-12)
        .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }))
    : [];
  // 대화는 user로 시작하고 user로 끝나야 한다
  while (messages.length && messages[0].role !== "user") messages.shift();
  if (!messages.length || messages.at(-1)?.role !== "user") {
    res.status(400).json({ error: "messages의 마지막은 user 질문이어야 해요" });
    return;
  }
  const started = Date.now();
  const result = await chat(messages);
  console.log(`[chat] ${result.mode} ${Date.now() - started}ms steps=${result.steps.length} "${messages.at(-1)?.content.slice(0, 40)}"`);
  res.json(result);
});
