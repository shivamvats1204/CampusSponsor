const { query } = require("../config/mysql");
const asyncHandler = require("../utils/asyncHandler");

async function getCollaborationBaseQuery(user) {
  let whereClause = "1 = 1";
  const params = [];

  if (user.role === "club") {
    whereClause = "e.club_id = ?";
    params.push(user.id);
  }

  if (user.role === "company") {
    whereClause = "col.company_id = ?";
    params.push(user.id);
  }

  return { whereClause, params };
}

const requestCollaboration = asyncHandler(async (req, res) => {
  const { eventId, tierId, message } = req.body;

  if (!eventId || !tierId) {
    return res.status(400).json({ message: "Event and tier are required." });
  }

  const eventRows = await query(
    `SELECT id, approval_status AS approvalStatus
     FROM events
     WHERE id = ?`,
    [Number(eventId)]
  );
  const event = eventRows[0];

  if (!event) {
    return res.status(404).json({ message: "Event not found." });
  }

  if (event.approvalStatus !== "approved") {
    return res.status(400).json({ message: "Only approved events can receive sponsor requests." });
  }

  const tierRows = await query(
    "SELECT id, event_id AS eventId FROM tiers WHERE id = ? AND event_id = ?",
    [Number(tierId), Number(eventId)]
  );

  if (!tierRows.length) {
    return res.status(400).json({ message: "The selected tier does not belong to this event." });
  }

  const existingRequest = await query(
    "SELECT id FROM collaborations WHERE event_id = ? AND company_id = ? AND tier_id = ?",
    [Number(eventId), req.user.id, Number(tierId)]
  );

  if (existingRequest.length) {
    return res.status(409).json({ message: "You already sent a request for this tier." });
  }

  const result = await query(
    `INSERT INTO collaborations (event_id, company_id, tier_id, message)
     VALUES (?, ?, ?, ?)`,
    [Number(eventId), req.user.id, Number(tierId), message || ""]
  );

  return res.status(201).json({
    message: "Collaboration request sent successfully.",
    collaboration: {
      id: result.insertId,
      chatId: `collab-${result.insertId}`
    }
  });
});

const respondToCollaboration = asyncHandler(async (req, res) => {
  const collaborationId = Number(req.params.id);
  const { status, note } = req.body;

  if (!["accepted", "rejected", "negotiating"].includes(status)) {
    return res.status(400).json({ message: "Invalid collaboration status." });
  }

  const rows = await query(
    `SELECT col.id, e.club_id AS clubId
     FROM collaborations col
     INNER JOIN events e ON e.id = col.event_id
     WHERE col.id = ?`,
    [collaborationId]
  );
  const collaboration = rows[0];

  if (!collaboration) {
    return res.status(404).json({ message: "Collaboration not found." });
  }

  if (req.user.role !== "admin" && collaboration.clubId !== req.user.id) {
    return res.status(403).json({ message: "Only the event owner or an admin can respond." });
  }

  await query(
    `UPDATE collaborations
     SET status = ?, negotiation_note = ?
     WHERE id = ?`,
    [status, note || "", collaborationId]
  );

  return res.json({ message: "Collaboration updated successfully." });
});

const getCollaborations = asyncHandler(async (req, res) => {
  const { whereClause, params } = await getCollaborationBaseQuery(req.user);
  const collaborations = await query(
    `SELECT col.id, col.event_id AS eventId, col.company_id AS companyId, col.tier_id AS tierId,
            col.status, col.message, col.negotiation_note AS negotiationNote,
            col.created_at AS createdAt,
            e.title AS eventTitle, e.club_id AS clubId,
            t.name AS tierName, t.price AS tierPrice,
            company_user.name AS companyOwnerName,
            company_profile.company_name AS companyName,
            club_user.name AS clubOwnerName,
            club_profile.club_name AS clubName
     FROM collaborations col
     INNER JOIN events e ON e.id = col.event_id
     INNER JOIN tiers t ON t.id = col.tier_id
     INNER JOIN users company_user ON company_user.id = col.company_id
     INNER JOIN companies company_profile ON company_profile.user_id = col.company_id
     INNER JOIN users club_user ON club_user.id = e.club_id
     INNER JOIN clubs club_profile ON club_profile.user_id = e.club_id
     WHERE ${whereClause}
     ORDER BY col.created_at DESC`,
    params
  );

  const hydratedCollaborations = collaborations.map((collaboration) => ({
    ...collaboration,
    chatId: `collab-${collaboration.id}`
  }));

  return res.json({ collaborations: hydratedCollaborations });
});

module.exports = {
  requestCollaboration,
  respondToCollaboration,
  getCollaborations
};

