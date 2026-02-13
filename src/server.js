import "dotenv/config";
import express from "express";
import healthRouter from "./api/routes/health.js";

const app = express();

const PORT = process.env.PORT || 8080;

app.use(express.json());

app.use("/", healthRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
