const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    actorId: Number,
    action: String,
    metadata: mongoose.Schema.Types.Mixed
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("ActivityLog", activityLogSchema);

