const { query } = require("../config/mysql");
const Media = require("../services/models/Media");
const asyncHandler = require("../utils/asyncHandler");
const { toPublicFilePath } = require("../middleware/upload");

async function getEventContext(eventId) {
  const rows = await query("SELECT id, club_id AS clubId FROM events WHERE id = ?", [eventId]);
  return rows[0] || null;
}

async function canAccessEventMedia(user, eventId, clubId) {
  if (user.role === "admin" || user.id === clubId) {
    return true;
  }

  if (user.role === "company") {
    const rows = await query(
      `SELECT id
       FROM collaborations
       WHERE event_id = ? AND company_id = ? AND status IN ('accepted', 'negotiating')`,
      [eventId, user.id]
    );
    return rows.length > 0;
  }

  return false;
}

const uploadMedia = asyncHandler(async (req, res) => {
  const eventId = Number(req.body.eventId);
  const collaborationId = req.body.collaborationId ? Number(req.body.collaborationId) : null;
  const title = String(req.body.title || "").trim();
  const file = req.file;

  if (!eventId || !file) {
    return res.status(400).json({ message: "Event and file are required." });
  }

  const event = await getEventContext(eventId);
  if (!event) {
    return res.status(404).json({ message: "Event not found." });
  }

  const hasAccess = await canAccessEventMedia(req.user, eventId, event.clubId);
  if (!hasAccess) {
    return res.status(403).json({ message: "You cannot upload media for this event." });
  }

  let type = "document";
  if (file.mimetype.startsWith("image/")) {
    type = "image";
  }
  if (file.mimetype.startsWith("video/")) {
    type = "video";
  }

  const media = await Media.create({
    eventId,
    collaborationId,
    uploadedBy: req.user.id,
    type,
    url: toPublicFilePath(file),
    mimeType: file.mimetype,
    originalName: file.originalname,
    title
  });

  return res.status(201).json({ message: "Media uploaded successfully.", media });
});

const getMediaForEvent = asyncHandler(async (req, res) => {
  const eventId = Number(req.params.eventId);
  const event = await getEventContext(eventId);

  if (!event) {
    return res.status(404).json({ message: "Event not found." });
  }

  const hasAccess = await canAccessEventMedia(req.user, eventId, event.clubId);
  if (!hasAccess) {
    return res.status(403).json({ message: "You cannot access event media." });
  }

  const media = await Media.find({ eventId }).sort({ createdAt: -1 }).lean();
  return res.json({ media });
});

module.exports = {
  uploadMedia,
  getMediaForEvent
};
