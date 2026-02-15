import "dotenv/config";
import express from "express";
import healthRouter from "./src/api/routes/health.js";
import authRouter from "./src/api/routes/auth.js";
import monitorRouter from "./src/api/routes/monitor.js";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use("/", healthRouter);
app.use("/auth", authRouter);
app.use("/monitor", monitorRouter);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
