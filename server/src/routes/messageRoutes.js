import { Router } from "express";
import {
  createMessage,
  getGlobalMessages,
  getPrivateMessages,
  reactToMessage,
} from "../controllers/messageController.js";
import { protect } from "../middlewares/auth.js";

const router = Router();

router.use(protect);
router.get("/global", getGlobalMessages);
router.get("/private/:userId", getPrivateMessages);
router.post("/", createMessage);
router.post("/:messageId/reactions", reactToMessage);

export default router;

