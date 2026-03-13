import { Router } from "express";
import { forgot_password, get_user, log_out, login, register, reset_password, update_password, updateProfile } from "../../controllers/authControllers.js";
import { isAuthenticated } from "../../middleware/auth_middleware.js";

const router = Router();

router.post("/register", register)
router.post("/login", login)
router.get("/me", isAuthenticated, get_user)
router.get("/logout", isAuthenticated, log_out)
router.post("/forgot-password", forgot_password)
router.patch("/reset-password", reset_password)
router.patch("/update-password", isAuthenticated, update_password)
router.put("/update-profile", isAuthenticated, updateProfile);

export default router;