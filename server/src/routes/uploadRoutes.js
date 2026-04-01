import { Router } from "express";
import { getCloudinarySignature, getGiphyConfig } from "../controllers/uploadController.js";
import { protect } from "../middlewares/auth.js";

const router = Router();

router.use(protect);
router.get("/cloudinary-signature", getCloudinarySignature);
router.get("/giphy", getGiphyConfig);

export default router;

