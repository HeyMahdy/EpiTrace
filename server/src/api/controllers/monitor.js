import {
  createMonitor,
  startMonitor,
  pauseMonitor,
  resumeMonitor,
  getMonitors,
  getMonitorById,
  updateMonitor,
  deleteMonitor,
  getMonitorHistory,
} from "../../services/monitor.js";
import { ZodError } from "zod";
import { createMonitorSchema, updateMonitorSchema } from "../validators/monitor.js";

export async function createMonitorController(req, res) {
  try {
    const userId = req.user.id;
    const data = createMonitorSchema.parse(req.body);
    const monitor = await createMonitor(userId, data);
    res.status(201).json({
      success: true,
      data: monitor,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(422).json({
        success: false,
        errors: error.errors,
      });
    }

    if (error.code === "23503") {
      return res.status(400).json({
        error: "Invalid user reference",
      });
    }

    if (error.code === "MONITOR_LIMIT_REACHED") {
      return res.status(409).json({
        success: false,
        error: "Only one monitor is allowed per account",
      });
    }

    console.error("Error creating monitor:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

export async function startMonitorController(req, res) {
  try {
    const userId = req.user.id;
    const monitorId = req.params.id;

    await startMonitor(userId, monitorId);

    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to start monitor" });
  }
}

export async function pauseMonitorController(req, res) {
  try {
    const userId = req.user.id;
    const monitorId = req.params.id;

    await pauseMonitor(userId, monitorId);

    res.json({ message: "Monitor paused" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function getMonitorsController(req, res) {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    const monitors = await getMonitors(userId, limit, offset);
    
    return res.status(200).json({
      success: true,
      data: monitors,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch monitors" });
  }
}

export async function getMonitorByIdController(req, res) {
  try {
    const userId = req.user.id;
    const monitorId = req.params.id;
    
    const monitor = await getMonitorById(userId, monitorId);
    
    return res.status(200).json({
      success: true,
      data: monitor,
    });
  } catch (error) {
    if (error.message === "Monitor not found") {
      return res.status(404).json({ error: error.message });
    }
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch monitor" });
  }
}

export async function updateMonitorController(req, res) {
  try {
    const userId = req.user.id;
    const monitorId = req.params.id;
    const updates = updateMonitorSchema.parse(req.body);
    
    const monitor = await updateMonitor(userId, monitorId, updates);
    
    return res.status(200).json({
      success: true,
      data: monitor,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(422).json({ errors: error.errors });
    }
    if (error.message === "Monitor not found") {
      return res.status(404).json({ error: error.message });
    }
    console.error(error);
    return res.status(500).json({ error: "Failed to update monitor" });
  }
}

export async function deleteMonitorController(req, res) {
  try {
    const userId = req.user.id;
    const monitorId = req.params.id;
    
    await deleteMonitor(userId, monitorId);
    
    return res.status(200).json({
      success: true,
      message: "Monitor deleted",
    });
  } catch (error) {
    if (error.message === "Monitor not found") {
      return res.status(404).json({ error: error.message });
    }
    console.error(error);
    return res.status(500).json({ error: "Failed to delete monitor" });
  }
}

export async function resumeMonitorController(req, res) {
  try {
    const userId = req.user.id;
    const monitorId = req.params.id;
    
    await resumeMonitor(userId, monitorId);
    
    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to resume monitor" });
  }
}

export async function getMonitorHistoryController(req, res) {
  try {
    const userId = req.user.id;
    const monitorId = req.params.id;
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    
    const history = await getMonitorHistory(monitorId, userId, limit, offset);
    
    return res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    if (error.message === "Monitor not found") {
      return res.status(404).json({ error: error.message });
    }
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch history" });
  }
}
