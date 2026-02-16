import express from "express";
import {
  createMonitorController,
  getMonitorsController,
  getMonitorByIdController,
  updateMonitorController,
  deleteMonitorController,
  startMonitorController,
  pauseMonitorController,
  resumeMonitorController,
  getMonitorHistoryController,
} from "../controllers/monitor.js";

const router = express.Router();

router.post("/create", createMonitorController);
router.get("/", getMonitorsController);
router.get("/:id", getMonitorByIdController);
router.patch("/:id", updateMonitorController);
router.delete("/:id", deleteMonitorController);

router.post("/start/:id", startMonitorController);
router.post("/pause/:id", pauseMonitorController);
router.post("/resume/:id", resumeMonitorController);

router.get("/:id/history", getMonitorHistoryController);

export default router;
