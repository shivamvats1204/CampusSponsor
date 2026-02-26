const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const controller = require("../controllers/profileController");

const router = express.Router();

router.get("/users", controller.getPublicProfiles);
router.get("/:id", controller.getProfile);
router.put("/update", authMiddleware, controller.updateProfile);

module.exports = router;

