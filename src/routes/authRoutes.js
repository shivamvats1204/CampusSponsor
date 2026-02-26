const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const controller = require("../controllers/authController");

const router = express.Router();

router.post("/register", controller.register);
router.post("/login", controller.login);
router.get("/logout", controller.logout);
router.get("/me", authMiddleware, controller.me);

module.exports = router;

