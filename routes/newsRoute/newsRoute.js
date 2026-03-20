import express from "express";
import {
    addNews,
    deleteNews,
    getNews,
    getNewsByAuthor,
    getNewsByCategory,
    getSingleNews,
    incrementShareCount,
    updateNews,
} from "../../controllers/newsControllers.js";
import {
    authorizedRoles,
    isAuthenticated,
} from "../../middleware/auth_middleware.js";

const router = express.Router();

// Public routes
router.get("/", getNews);
router.get("/:id", getSingleNews);
router.get("/category/:category", getNewsByCategory);
router.get("/author/:author_id", getNewsByAuthor);
router.put("/share/:id", incrementShareCount);

// Protected routes (require authentication)
router.post("/", isAuthenticated, addNews);
router.put("/:id", isAuthenticated, updateNews);
router.delete("/:id", isAuthenticated, authorizedRoles("Admin"), deleteNews);

export default router;
