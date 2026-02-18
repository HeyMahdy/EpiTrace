import { ZodError } from "zod";
import {
  createUserWebhook,
  getUserWebhooks,
  getUserWebhookById,
  updateUserWebhook,
  deleteUserWebhook,
  addWebhookToMonitor,
  removeWebhookFromMonitor,
  getMonitorWebhooks,
} from "../../services/webhook.js";
import { getMonitorById } from "../../services/monitor.js";
import { createWebhookSchema, updateWebhookSchema } from "../validators/monitor.js";

/**
 * Create a new webhook for the authenticated user
 */
export async function createWebhookController(req, res) {
  try {
    const userId = req.user.id;
    const data = createWebhookSchema.parse(req.body);
    const webhook = await createUserWebhook(userId, data);

    return res.status(201).json({
      success: true,
      data: webhook,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(422).json({
        success: false,
        errors: error.errors,
      });
    }

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        error: "Webhook URL already exists for this provider",
      });
    }

    console.error("Error creating webhook:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to create webhook",
    });
  }
}

/**
 * Get all webhooks for authenticated user
 */
export async function getWebhooksController(req, res) {
  try {
    const userId = req.user.id;
    const webhooks = await getUserWebhooks(userId);

    return res.status(200).json({
      success: true,
      data: webhooks,
    });
  } catch (error) {
    console.error("Error fetching webhooks:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch webhooks",
    });
  }
}

/**
 * Get a specific webhook by ID
 */
export async function getWebhookController(req, res) {
  try {
    const userId = req.user.id;
    const webhookId = req.params.id;

    const webhook = await getUserWebhookById(userId, webhookId);

    return res.status(200).json({
      success: true,
      data: webhook,
    });
  } catch (error) {
    if (error.message === "Webhook not found") {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    console.error("Error fetching webhook:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch webhook",
    });
  }
}

/**
 * Update a webhook
 */
export async function updateWebhookController(req, res) {
  try {
    const userId = req.user.id;
    const webhookId = req.params.id;
    const updates = updateWebhookSchema.parse(req.body);

    const webhook = await updateUserWebhook(userId, webhookId, updates);

    return res.status(200).json({
      success: true,
      data: webhook,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(422).json({
        success: false,
        errors: error.errors,
      });
    }

    if (error.message === "Webhook not found") {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    console.error("Error updating webhook:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to update webhook",
    });
  }
}

/**
 * Delete a webhook
 */
export async function deleteWebhookController(req, res) {
  try {
    const userId = req.user.id;
    const webhookId = req.params.id;

    await deleteUserWebhook(userId, webhookId);

    return res.status(200).json({
      success: true,
      message: "Webhook deleted",
    });
  } catch (error) {
    if (error.message === "Webhook not found") {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    console.error("Error deleting webhook:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to delete webhook",
    });
  }
}

/**
 * Add a webhook to a monitor
 */
export async function addWebhookToMonitorController(req, res) {
  try {
    const userId = req.user.id;
    const { monitorId, webhookId } = req.params;

    // Verify monitor ownership
    await getMonitorById(userId, monitorId);

    // Verify webhook ownership
    await getUserWebhookById(userId, webhookId);

    const association = await addWebhookToMonitor(monitorId, webhookId);

    return res.status(201).json({
      success: true,
      data: association,
    });
  } catch (error) {
    if (error.message === "Monitor not found" || error.message === "Webhook not found") {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        error: "Webhook already associated with this monitor",
      });
    }

    console.error("Error associating webhook:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to add webhook to monitor",
    });
  }
}

/**
 * Remove a webhook from a monitor
 */
export async function removeWebhookFromMonitorController(req, res) {
  try {
    const userId = req.user.id;
    const { monitorId, webhookId } = req.params;

    // Verify monitor ownership
    await getMonitorById(userId, monitorId);

    // Verify webhook ownership
    await getUserWebhookById(userId, webhookId);

    await removeWebhookFromMonitor(monitorId, webhookId);

    return res.status(200).json({
      success: true,
      message: "Webhook removed from monitor",
    });
  } catch (error) {
    if (error.message === "Monitor not found" || error.message === "Webhook not found") {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    if (error.message === "Monitor webhook association not found") {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    console.error("Error removing webhook from monitor:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to remove webhook from monitor",
    });
  }
}

/**
 * Get all webhooks for a specific monitor
 */
export async function getMonitorWebhooksController(req, res) {
  try {
    const userId = req.user.id;
    const monitorId = req.params.monitorId;

    // Verify monitor ownership
    await getMonitorById(userId, monitorId);

    const webhooks = await getMonitorWebhooks(monitorId);

    return res.status(200).json({
      success: true,
      data: webhooks,
    });
  } catch (error) {
    if (error.message === "Monitor not found") {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    console.error("Error fetching monitor webhooks:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch monitor webhooks",
    });
  }
}
