import { ZodError } from "zod";
import {
  createUserGithubToken,
  getUserGithubTokens,
  getUserGithubTokenById,
  updateUserGithubToken,
  deleteUserGithubToken,
  addGithubTokenToMonitor,
  removeGithubTokenFromMonitor,
} from "../../services/githubToken.js";
import {
  createGithubTokenSchema,
  updateGithubTokenSchema,
} from "../validators/monitor.js";
import { getMonitorById } from "../../services/monitor.js";

export async function createGithubTokenController(req, res) {
  try {
    const userId = req.user.id;
    const data = createGithubTokenSchema.parse(req.body);
    const token = await createUserGithubToken(userId, data);

    return res.status(201).json({
      success: true,
      data: token,
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
        error: "GitHub token already exists for this user",
      });
    }

    if (error.code === "USER_NOT_FOUND" || error.code === "23503") {
      return res.status(401).json({
        success: false,
        error: "Invalid token user",
      });
    }

    console.error("Error creating GitHub token:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to create GitHub token",
    });
  }
}

export async function getGithubTokensController(req, res) {
  try {
    const userId = req.user.id;
    const tokens = await getUserGithubTokens(userId);

    return res.status(200).json({
      success: true,
      data: tokens,
    });
  } catch (error) {
    console.error("Error fetching GitHub tokens:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch GitHub tokens",
    });
  }
}

export async function getGithubTokenController(req, res) {
  try {
    const userId = req.user.id;
    const tokenId = req.params.id;
    const token = await getUserGithubTokenById(userId, tokenId);

    return res.status(200).json({
      success: true,
      data: token,
    });
  } catch (error) {
    if (error.message === "GitHub token not found") {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    console.error("Error fetching GitHub token:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch GitHub token",
    });
  }
}

export async function updateGithubTokenController(req, res) {
  try {
    const userId = req.user.id;
    const tokenId = req.params.id;
    const updates = updateGithubTokenSchema.parse(req.body);
    const token = await updateUserGithubToken(userId, tokenId, updates);

    return res.status(200).json({
      success: true,
      data: token,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(422).json({
        success: false,
        errors: error.errors,
      });
    }

    if (error.message === "GitHub token not found") {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    console.error("Error updating GitHub token:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to update GitHub token",
    });
  }
}

export async function deleteGithubTokenController(req, res) {
  try {
    const userId = req.user.id;
    const tokenId = req.params.id;
    await deleteUserGithubToken(userId, tokenId);

    return res.status(200).json({
      success: true,
      message: "GitHub token deleted",
    });
  } catch (error) {
    if (error.message === "GitHub token not found") {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    console.error("Error deleting GitHub token:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to delete GitHub token",
    });
  }
}

export async function addGithubTokenToMonitorController(req, res) {
  try {
    const userId = req.user.id;
    const { monitorId, tokenId } = req.params;

    await getMonitorById(userId, monitorId);
    await getUserGithubTokenById(userId, tokenId);

    const association = await addGithubTokenToMonitor(monitorId, tokenId);

    return res.status(201).json({
      success: true,
      data: association,
    });
  } catch (error) {
    if (error.message === "Monitor not found" || error.message === "GitHub token not found") {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        error: "GitHub token already associated with this monitor",
      });
    }

    console.error("Error associating GitHub token:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to add GitHub token to monitor",
    });
  }
}

export async function removeGithubTokenFromMonitorController(req, res) {
  try {
    const userId = req.user.id;
    const { monitorId, tokenId } = req.params;

    await getMonitorById(userId, monitorId);
    await getUserGithubTokenById(userId, tokenId);
    await removeGithubTokenFromMonitor(monitorId, tokenId);

    return res.status(200).json({
      success: true,
      message: "GitHub token removed from monitor",
    });
  } catch (error) {
    if (error.message === "Monitor not found" || error.message === "GitHub token not found") {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    if (error.message === "Monitor GitHub token association not found") {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    console.error("Error removing GitHub token from monitor:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to remove GitHub token from monitor",
    });
  }
}
