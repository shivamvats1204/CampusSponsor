const express = require("express");
const { authMiddleware, authorizeRoles } = require("../middleware/auth");
const controller = require("../controllers/adminController");

const router = express.Router();

router.use(authMiddleware, authorizeRoles("admin"));
router.get("/users", controller.getUsers);
router.get("/events/pending", controller.getPendingEvents);
router.put("/events/:id/approval", controller.updateEventApproval);
router.delete("/users/:id", controller.deleteUser);

module.exports = router;

