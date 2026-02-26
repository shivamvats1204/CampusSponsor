const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const { mediaUpload } = require("../middleware/upload");
const controller = require("../controllers/mediaController");

const router = express.Router();

router.post("/upload", authMiddleware, mediaUpload.single("file"), controller.uploadMedia);
router.get("/:eventId", authMiddleware, controller.getMediaForEvent);

module.exports = router;

