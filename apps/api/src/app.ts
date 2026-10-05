import cors from "cors";
import express from "express";

// Allowed web origin(s) for cross-origin requests. In production set
// `WEB_ORIGIN` to the deployed web URL (comma-separated for several). When
// unset (dev/test) any origin is reflected, which keeps local work friction-free.
const webOrigin = process.env.WEB_ORIGIN?.trim();
const corsOptions: cors.CorsOptions = webOrigin
  ? { origin: webOrigin.split(",").map((o) => o.trim()) }
  : { origin: true };

export const app = express();
app.use(cors(corsOptions));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});
