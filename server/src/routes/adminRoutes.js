import { Router } from "express";
import {
  getAnalytics,
  getChatLogs,
  getReports,
  getUsers,
  toggleBanUser,
} from "../controllers/adminController.js";
import { protect, requireAdmin } from "../middlewares/auth.js";

const router = Router();

router.use(protect, requireAdmin);
router.get("/users", getUsers);
router.get("/analytics", getAnalytics);
router.get("/chat-logs", getChatLogs);
router.get("/reports", getReports);
router.patch("/users/:userId/ban", toggleBanUser);

export default router;
