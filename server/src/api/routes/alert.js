import express from "express";
import {
  sendAlertController,
  triggerCodeAgentController,
} from "../controllers/alert.js";

const router = express.Router();

router.post("/send", sendAlertController);
router.get("/trigger-agent", triggerCodeAgentController);

export default router;
