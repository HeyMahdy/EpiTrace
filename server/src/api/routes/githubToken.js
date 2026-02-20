import express from "express";
import {
  createGithubTokenController,
  getGithubTokensController,
  getGithubTokenController,
  getGithubTokensForMonitorController,
  updateGithubTokenController,
  deleteGithubTokenController,
  addGithubTokenToMonitorController,
  removeGithubTokenFromMonitorController,
} from "../controllers/githubToken.js";

const router = express.Router();

router.post("/", createGithubTokenController);
router.get("/", getGithubTokensController);
router.get("/monitor/:monitorId", getGithubTokensForMonitorController);
router.get("/:id", getGithubTokenController);
router.patch("/:id", updateGithubTokenController);
router.delete("/:id", deleteGithubTokenController);
router.post("/monitor/:monitorId/add/:tokenId", addGithubTokenToMonitorController);
router.delete("/monitor/:monitorId/remove/:tokenId", removeGithubTokenFromMonitorController);

export default router;
