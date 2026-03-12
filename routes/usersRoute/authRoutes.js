import { Router } from "express";
import { get_user, log_out, login, register } from "../../controllers/authControllers.js";

const router = Router();

router.post("/register", register)
router.post("/login", login)
router.get("/me", get_user)
router.get("/logout", log_out)

export default router;