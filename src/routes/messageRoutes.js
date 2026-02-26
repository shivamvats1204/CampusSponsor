const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const { messageUpload } = require("../middleware/upload");
const controller = require("../controllers/messageController");

const router = express.Router();

router.post("/send", authMiddleware, messageUpload.single("attachment"), controller.sendMessage);
router.get("/:chatId", authMiddleware, controller.getMessages);

module.exports = router;

