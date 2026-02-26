const express = require("express");
const { authMiddleware, authorizeRoles } = require("../middleware/auth");
const controller = require("../controllers/tierController");

const router = express.Router();

router.post("/add", authMiddleware, authorizeRoles("club", "admin"), controller.addTier);
router.put("/update/:id", authMiddleware, authorizeRoles("club", "admin"), controller.updateTier);
router.delete(
  "/delete/:id",
  authMiddleware,
  authorizeRoles("club", "admin"),
  controller.deleteTier
);

module.exports = router;

