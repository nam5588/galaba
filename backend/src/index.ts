import "dotenv/config";
import cors from "cors";
import express from "express";
import { fd1Router } from "./routes/fd1.js";
import { chatRouter } from "./routes/chat.js";
import { noticesRouter } from "./routes/notices.js";
import { scheduleRouter } from "./routes/schedule.js";

const app = express();
const PORT = Number(process.env.PORT) || 4100;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/notices", noticesRouter);
app.use("/api/schedule", scheduleRouter);
app.use("/api/fd1", fd1Router);
app.use("/api/chat", chatRouter);

// Vercel에서는 플랫폼이 서버를 띄우므로 로컬에서만 listen
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
}

export default app;
