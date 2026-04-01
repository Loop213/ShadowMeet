import { Router } from "express";
import { getMatchHistory, reportUser } from "../controllers/sessionController.js";
import { protect } from "../middlewares/auth.js";

const router = Router();

router.use(protect);
router.get("/history", getMatchHistory);
router.post("/report", reportUser);

export default router;
