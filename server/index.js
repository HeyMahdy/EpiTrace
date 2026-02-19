import "dotenv/config";
import express from "express";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { requireAuth } from "./src/api/middlewares/requireAuth.js";
import healthRouter from "./src/api/routes/health.js";
import authRouter from "./src/api/routes/auth.js";
import monitorRouter from "./src/api/routes/monitor.js";
import webhookRouter from "./src/api/routes/webhook.js";
import githubTokenRouter from "./src/api/routes/githubToken.js";
import alertRouter from "./src/api/routes/alert.js";

const app = express();
const PORT = process.env.PORT || 8080;
const SERVER_PUBLIC_URL = (
  process.env.SERVER_PUBLIC_URL || `http://localhost:${PORT}`
).replace(/\/$/, "");
const ALLOWED_ORIGIN = "http://localhost:3000";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.3",
    info: {
      title: "EpiTrace API",
      version: "1.0.0",
      description: "API documentation for EpiTrace backend services",
    },
    servers: [{ url: SERVER_PUBLIC_URL }],
  },
  apis: [join(__dirname, "src/docs/swagger.js")],
});

app.use((req, res, next) => {
  if (req.headers.origin === ALLOWED_ORIGIN) {
    res.header("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
    res.header("Vary", "Origin");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  }

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  return next();
});

app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/", healthRouter);
app.use("/auth", authRouter);
app.use("/alert", alertRouter);

app.use(requireAuth); // Protect all routes below this middleware
app.use("/monitor", monitorRouter);
app.use("/webhook", webhookRouter);
app.use("/github-token", githubTokenRouter);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
