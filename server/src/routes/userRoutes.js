import { Router } from "express";
import { getDiscoverUsers, getOnlineUsers, updateProfile } from "../controllers/userController.js";
import { protect } from "../middlewares/auth.js";

const router = Router();

router.get("/discover", protect, getDiscoverUsers);
router.get("/online", protect, getOnlineUsers);
router.patch("/me", protect, updateProfile);

export default router;
