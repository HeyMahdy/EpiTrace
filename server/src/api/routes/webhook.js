import express from "express";
import {
  createWebhookController,
  getWebhooksController,
  getWebhookController,
  updateWebhookController,
  deleteWebhookController,
  addWebhookToMonitorController,
  removeWebhookFromMonitorController,
  getMonitorWebhooksController,
} from "../controllers/webhook.js";

const router = express.Router();

// User webhook endpoints
router.post("/", createWebhookController);
router.get("/", getWebhooksController);
router.get("/:id", getWebhookController);
router.patch("/:id", updateWebhookController);
router.delete("/:id", deleteWebhookController);

// Webhook-Monitor associations
router.post("/monitor/:monitorId/add/:webhookId", addWebhookToMonitorController);
router.delete("/monitor/:monitorId/remove/:webhookId", removeWebhookFromMonitorController);
router.get("/monitor/:monitorId", getMonitorWebhooksController);

export default router;
