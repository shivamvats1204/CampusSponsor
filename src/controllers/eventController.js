const { pool, query } = require("../config/mysql");
const asyncHandler = require("../utils/asyncHandler");
const { parseTiers } = require("../utils/eventHelpers");
const { toPublicFilePath } = require("../middleware/upload");

async function getEventRows(whereSql, params) {
  return query(
    `SELECT e.id, e.club_id AS clubId, e.title, e.description, e.category,
            e.event_date AS eventDate, e.venue, e.location, e.audience,
            e.brochure_url AS brochureUrl, e.poster_url AS posterUrl,
            e.approval_status AS approvalStatus, e.created_at AS createdAt,
            u.name AS ownerName, c.club_name AS clubName, c.college_name AS collegeName,
            c.description AS clubDescription, c.audience_size AS clubAudienceSize
     FROM events e
     INNER JOIN users u ON u.id = e.club_id
     INNER JOIN clubs c ON c.user_id = e.club_id
     ${whereSql}
     ORDER BY e.event_date ASC, e.created_at DESC`,
    params
  );
}

async function getTiersForEvent(eventId) {
  return query(
    `SELECT id, event_id AS eventId, name, price, benefits, deliverables, created_at AS createdAt
     FROM tiers
     WHERE event_id = ?
     ORDER BY price ASC`,
    [eventId]
  );
}

const createEvent = asyncHandler(async (req, res) => {
  const { title, description, category, eventDate, venue, location, audience } = req.body;
  const tiers = parseTiers(req.body.tiers);
  const brochureFile = req.files?.brochure?.[0] || null;
  const posterFile = req.files?.poster?.[0] || null;

  if (!title || !description || !category || !eventDate || !venue || !location) {
    return res.status(400).json({ message: "All required event fields must be provided." });
  }

  if (!tiers.length) {
    return res.status(400).json({ message: "At least one valid sponsorship tier is required." });
  }

  const connection = await pool.getConnection();
  let eventId;

  try {
    await connection.beginTransaction();
    const [eventResult] = await connection.query(
      `INSERT INTO events
       (club_id, title, description, category, event_date, venue, location, audience, brochure_url, poster_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        title,
        description,
        category,
        eventDate,
        venue,
        location,
        Number(audience || 0),
        toPublicFilePath(brochureFile),
        toPublicFilePath(posterFile)
      ]
    );
    eventId = eventResult.insertId;

    for (const tier of tiers) {
      await connection.query(
        "INSERT INTO tiers (event_id, name, price, benefits, deliverables) VALUES (?, ?, ?, ?, ?)",
        [eventId, tier.name, tier.price, tier.benefits, tier.deliverables]
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  const eventRows = await getEventRows("WHERE e.id = ?", [eventId]);
  const event = eventRows[0];
  event.tiers = await getTiersForEvent(eventId);

  return res.status(201).json({
    message: "Event created successfully and is pending admin approval.",
    event
  });
});

const getAllEvents = asyncHandler(async (req, res) => {
  const conditions = [];
  const params = [];
  const { location, category, minAudience, maxAudience, q } = req.query;

  if (req.user?.role === "admin") {
    conditions.push("1 = 1");
  } else if (req.user?.role === "club") {
    conditions.push("(e.approval_status = 'approved' OR e.club_id = ?)");
    params.push(req.user.id);
  } else {
    conditions.push("e.approval_status = 'approved'");
  }

  if (location) {
    conditions.push("LOWER(e.location) LIKE ?");
    params.push(`%${String(location).toLowerCase()}%`);
  }

  if (category) {
    conditions.push("LOWER(e.category) LIKE ?");
    params.push(`%${String(category).toLowerCase()}%`);
  }

  if (minAudience) {
    conditions.push("e.audience >= ?");
    params.push(Number(minAudience));
  }

  if (maxAudience) {
    conditions.push("e.audience <= ?");
    params.push(Number(maxAudience));
  }

  if (q) {
    conditions.push("(LOWER(e.title) LIKE ? OR LOWER(e.description) LIKE ?)");
    params.push(`%${String(q).toLowerCase()}%`, `%${String(q).toLowerCase()}%`);
  }

  const eventRows = await getEventRows(`WHERE ${conditions.join(" AND ")}`, params);
  const events = await Promise.all(
    eventRows.map(async (event) => ({
      ...event,
      tiers: await getTiersForEvent(event.id)
    }))
  );

  return res.json({ events });
});

const getEventById = asyncHandler(async (req, res) => {
  const eventRows = await getEventRows("WHERE e.id = ?", [Number(req.params.id)]);
  const event = eventRows[0];

  if (!event) {
    return res.status(404).json({ message: "Event not found." });
  }

  const isOwner = req.user && req.user.id === event.clubId;
  const isAdmin = req.user?.role === "admin";

  if (event.approvalStatus !== "approved" && !isOwner && !isAdmin) {
    return res.status(403).json({ message: "This event is not publicly available yet." });
  }

  const tiers = await getTiersForEvent(event.id);
  const collaborationStats = await query(
    `SELECT status, COUNT(*) AS count
     FROM collaborations
     WHERE event_id = ?
     GROUP BY status`,
    [event.id]
  );

  return res.json({
    event: {
      ...event,
      tiers,
      collaborationStats
    }
  });
});

const updateEvent = asyncHandler(async (req, res) => {
  const eventId = Number(req.params.id);
  const eventRows = await query("SELECT * FROM events WHERE id = ?", [eventId]);
  const existingEvent = eventRows[0];

  if (!existingEvent) {
    return res.status(404).json({ message: "Event not found." });
  }

  if (req.user.role !== "admin" && existingEvent.club_id !== req.user.id) {
    return res.status(403).json({ message: "You can only update your own events." });
  }

  const {
    title,
    description,
    category,
    eventDate,
    venue,
    location,
    audience
  } = req.body;

  await query(
    `UPDATE events
     SET title = ?, description = ?, category = ?, event_date = ?, venue = ?, location = ?, audience = ?
     WHERE id = ?`,
    [
      title || existingEvent.title,
      description || existingEvent.description,
      category || existingEvent.category,
      eventDate || existingEvent.event_date,
      venue || existingEvent.venue,
      location || existingEvent.location,
      Number(audience ?? existingEvent.audience),
      eventId
    ]
  );

  const eventRowsAfterUpdate = await getEventRows("WHERE e.id = ?", [eventId]);
  const event = eventRowsAfterUpdate[0];
  event.tiers = await getTiersForEvent(eventId);

  return res.json({ message: "Event updated successfully.", event });
});

const deleteEvent = asyncHandler(async (req, res) => {
  const eventId = Number(req.params.id);
  const eventRows = await query("SELECT club_id AS clubId FROM events WHERE id = ?", [eventId]);
  const event = eventRows[0];

  if (!event) {
    return res.status(404).json({ message: "Event not found." });
  }

  if (req.user.role !== "admin" && event.clubId !== req.user.id) {
    return res.status(403).json({ message: "You can only delete your own events." });
  }

  await query("DELETE FROM events WHERE id = ?", [eventId]);
  return res.json({ message: "Event deleted successfully." });
});

const updateApprovalStatus = asyncHandler(async (req, res) => {
  const eventId = Number(req.params.id);
  const { approvalStatus } = req.body;

  if (!["approved", "rejected", "pending"].includes(approvalStatus)) {
    return res.status(400).json({ message: "Invalid approval status." });
  }

  const result = await query("UPDATE events SET approval_status = ? WHERE id = ?", [
    approvalStatus,
    eventId
  ]);

  if (!result.affectedRows) {
    return res.status(404).json({ message: "Event not found." });
  }

  const eventRows = await getEventRows("WHERE e.id = ?", [eventId]);
  const event = eventRows[0];
  event.tiers = await getTiersForEvent(eventId);

  return res.json({ message: "Event approval updated successfully.", event });
});

module.exports = {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  updateApprovalStatus
};

