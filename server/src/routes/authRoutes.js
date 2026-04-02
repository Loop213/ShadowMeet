import { Router } from "express";
import {
  guestLogin,
  login,
  logoutSession,
  me,
  refreshSession,
  register,
  requestOtp,
  verifyOtpLogin,
} from "../controllers/authController.js";
import { protect } from "../middlewares/auth.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/guest", guestLogin);
router.post("/refresh", refreshSession);
router.post("/logout", logoutSession);
router.post("/request-otp", requestOtp);
router.post("/verify-otp", verifyOtpLogin);
router.get("/me", protect, me);

export default router;
