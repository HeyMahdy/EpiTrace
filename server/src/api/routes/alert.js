import express from "express";
import { sendAlertController } from "../controllers/alert.js";

const router = express.Router();

router.post("/send", sendAlertController);

export default router;
