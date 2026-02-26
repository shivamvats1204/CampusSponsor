const express = require("express");
const { authMiddleware, authorizeRoles } = require("../middleware/auth");
const controller = require("../controllers/collaborationController");

const router = express.Router();

router.post("/request", authMiddleware, authorizeRoles("company"), controller.requestCollaboration);
router.put(
  "/respond/:id",
  authMiddleware,
  authorizeRoles("club", "admin"),
  controller.respondToCollaboration
);
router.get("/all", authMiddleware, controller.getCollaborations);

module.exports = router;

