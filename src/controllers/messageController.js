const { query } = require("../config/mysql");
const Message = require("../services/models/Message");
const asyncHandler = require("../utils/asyncHandler");
const { toPublicFilePath } = require("../middleware/upload");

async function getCollaborationParticipants(collaborationId) {
  const rows = await query(
    `SELECT col.id, col.company_id AS companyId, e.club_id AS clubId
     FROM collaborations col
     INNER JOIN events e ON e.id = col.event_id
     WHERE col.id = ?`,
    [collaborationId]
  );
  return rows[0] || null;
}

function canAccessChat(user, participants) {
  return user.role === "admin" || user.id === participants.companyId || user.id === participants.clubId;
}

const sendMessage = asyncHandler(async (req, res) => {
  const collaborationId = Number(req.body.collaborationId);
  const rawMessage = String(req.body.message || "").trim();
  const attachment = req.file ? req.file : null;

  if (!collaborationId) {
    return res.status(400).json({ message: "A collaboration is required for messaging." });
  }

  if (!rawMessage && !attachment) {
    return res.status(400).json({ message: "Enter a message or attach a file." });
  }

  const participants = await getCollaborationParticipants(collaborationId);
  if (!participants) {
    return res.status(404).json({ message: "Collaboration not found." });
  }

  if (!canAccessChat(req.user, participants)) {
    return res.status(403).json({ message: "You cannot post to this chat." });
  }

  const receiverId =
    req.user.id === participants.companyId ? participants.clubId : participants.companyId;

  const message = await Message.create({
    chatId: `collab-${collaborationId}`,
    collaborationId,
    senderId: req.user.id,
    receiverId,
    message: rawMessage,
    attachment: attachment
      ? {
          name: attachment.originalname,
          url: toPublicFilePath(attachment),
          mimeType: attachment.mimetype
        }
      : undefined
  });

  return res.status(201).json({ message: "Message sent successfully.", data: message });
});

const getMessages = asyncHandler(async (req, res) => {
  const chatId = req.params.chatId;
  const collaborationId = Number(chatId.replace("collab-", ""));

  if (!collaborationId) {
    return res.status(400).json({ message: "Invalid chat identifier." });
  }

  const participants = await getCollaborationParticipants(collaborationId);
  if (!participants) {
    return res.status(404).json({ message: "Collaboration not found." });
  }

  if (!canAccessChat(req.user, participants)) {
    return res.status(403).json({ message: "You cannot access this chat." });
  }

  const messages = await Message.find({ chatId }).sort({ createdAt: 1 }).lean();
  return res.json({ chatId, messages });
});

module.exports = {
  sendMessage,
  getMessages
};
