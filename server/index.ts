import cors from "cors";
import express from "express";
import { caseRouter } from "./routes/case";
import { submissionRouter } from "./routes/submission";
import { voiceRouter } from "./routes/voice";

const app = express();
const port = 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.json({ ok: true });
});

app.use("/api/case", caseRouter);
app.use("/api/voice", voiceRouter);
app.use("/api/submit", submissionRouter);

app.listen(port, () => {
  console.log(`AuthFlow API listening on http://localhost:${port}`);
});
