const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema(
  {
    name: String,
    url: String,
    mimeType: String
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    chatId: {
      type: String,
      required: true,
      index: true
    },
    collaborationId: {
      type: Number,
      required: true,
      index: true
    },
    senderId: {
      type: Number,
      required: true
    },
    receiverId: {
      type: Number,
      required: true
    },
    message: {
      type: String,
      trim: true,
      default: ""
    },
    attachment: attachmentSchema
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

module.exports = mongoose.model("Message", messageSchema);

