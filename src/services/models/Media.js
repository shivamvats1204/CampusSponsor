const mongoose = require("mongoose");

const mediaSchema = new mongoose.Schema(
  {
    eventId: {
      type: Number,
      required: true,
      index: true
    },
    collaborationId: {
      type: Number,
      default: null
    },
    uploadedBy: {
      type: Number,
      required: true
    },
    type: {
      type: String,
      enum: ["image", "video", "document"],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    title: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

module.exports = mongoose.model("Media", mediaSchema);

