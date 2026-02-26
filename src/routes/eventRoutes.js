const express = require("express");
const { authMiddleware, authorizeRoles, optionalAuth } = require("../middleware/auth");
const { eventUpload } = require("../middleware/upload");
const controller = require("../controllers/eventController");

const router = express.Router();

router.get("/all", optionalAuth, controller.getAllEvents);
router.get("/:id", optionalAuth, controller.getEventById);
router.post(
  "/create",
  authMiddleware,
  authorizeRoles("club"),
  eventUpload.fields([
    { name: "brochure", maxCount: 1 },
    { name: "poster", maxCount: 1 }
  ]),
  controller.createEvent
);
router.put("/update/:id", authMiddleware, authorizeRoles("club", "admin"), controller.updateEvent);
router.delete(
  "/delete/:id",
  authMiddleware,
  authorizeRoles("club", "admin"),
  controller.deleteEvent
);
router.put("/:id/approval", authMiddleware, authorizeRoles("admin"), controller.updateApprovalStatus);

module.exports = router;

