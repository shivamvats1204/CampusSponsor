const { query } = require("../config/mysql");
const Message = require("../services/models/Message");
const Media = require("../services/models/Media");
const asyncHandler = require("../utils/asyncHandler");

async function buildClubDashboard(userId) {
  const [summaryRows, events, collaborations] = await Promise.all([
    query(
      `SELECT
          COUNT(*) AS totalEvents,
          SUM(CASE WHEN approval_status = 'approved' THEN 1 ELSE 0 END) AS approvedEvents,
          SUM(CASE WHEN approval_status = 'pending' THEN 1 ELSE 0 END) AS pendingEvents
       FROM events
       WHERE club_id = ?`,
      [userId]
    ),
    query(
      `SELECT id, title, category, event_date AS eventDate, venue, location, audience,
              approval_status AS approvalStatus
       FROM events
       WHERE club_id = ?
       ORDER BY event_date ASC`,
      [userId]
    ),
    query(
      `SELECT col.id, col.status, col.created_at AS createdAt, e.title AS eventTitle,
              company_profile.company_name AS companyName, t.name AS tierName, t.price AS tierPrice
       FROM collaborations col
       INNER JOIN events e ON e.id = col.event_id
       INNER JOIN companies company_profile ON company_profile.user_id = col.company_id
       INNER JOIN tiers t ON t.id = col.tier_id
       WHERE e.club_id = ?
       ORDER BY col.created_at DESC
       LIMIT 8`,
      [userId]
    )
  ]);

  return {
    role: "club",
    summary: summaryRows[0],
    events,
    collaborations
  };
}

async function buildCompanyDashboard(userId) {
  const [summaryRows, collaborations, eventRecommendations, mediaEventRows] = await Promise.all([
    query(
      `SELECT
          COUNT(*) AS totalRequests,
          SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) AS activeCollaborations,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pendingRequests
       FROM collaborations
       WHERE company_id = ?`,
      [userId]
    ),
    query(
      `SELECT col.id, col.status, col.created_at AS createdAt, e.id AS eventId, e.title AS eventTitle,
              e.location, t.name AS tierName, t.price AS tierPrice,
              club_profile.club_name AS clubName
       FROM collaborations col
       INNER JOIN events e ON e.id = col.event_id
       INNER JOIN tiers t ON t.id = col.tier_id
       INNER JOIN clubs club_profile ON club_profile.user_id = e.club_id
       WHERE col.company_id = ?
       ORDER BY col.created_at DESC
       LIMIT 8`,
      [userId]
    ),
    query(
      `SELECT e.id, e.title, e.category, e.location, e.event_date AS eventDate,
              c.club_name AS clubName
       FROM events e
       INNER JOIN clubs c ON c.user_id = e.club_id
       WHERE e.approval_status = 'approved'
       ORDER BY e.event_date ASC
       LIMIT 6`
    ),
    query(
      `SELECT DISTINCT event_id AS eventId
       FROM collaborations
       WHERE company_id = ? AND status IN ('accepted', 'negotiating')`,
      [userId]
    )
  ]);

  const mediaEventIds = mediaEventRows.map((row) => row.eventId);
  const mediaReceived = mediaEventIds.length
    ? await Media.countDocuments({ eventId: { $in: mediaEventIds } }).exec()
    : 0;

  return {
    role: "company",
    summary: {
      ...summaryRows[0],
      mediaReceived
    },
    collaborations,
    eventRecommendations
  };
}

async function buildAdminDashboard() {
  const [
    userCounts,
    eventCounts,
    collaborationCounts,
    recentUsers,
    pendingEvents,
    totalMessages,
    totalMedia
  ] = await Promise.all([
    query(
      `SELECT
          COUNT(*) AS totalUsers,
          SUM(CASE WHEN role = 'club' THEN 1 ELSE 0 END) AS clubUsers,
          SUM(CASE WHEN role = 'company' THEN 1 ELSE 0 END) AS companyUsers,
          SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) AS adminUsers
       FROM users`
    ),
    query(
      `SELECT
          COUNT(*) AS totalEvents,
          SUM(CASE WHEN approval_status = 'pending' THEN 1 ELSE 0 END) AS pendingEvents,
          SUM(CASE WHEN approval_status = 'approved' THEN 1 ELSE 0 END) AS approvedEvents
       FROM events`
    ),
    query(
      `SELECT
          COUNT(*) AS totalCollaborations,
          SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) AS acceptedCollaborations
       FROM collaborations`
    ),
    query(
      "SELECT id, name, email, role, created_at AS createdAt FROM users ORDER BY created_at DESC LIMIT 6"
    ),
    query(
      `SELECT e.id, e.title, e.category, e.location, e.event_date AS eventDate,
              c.club_name AS clubName
       FROM events e
       INNER JOIN clubs c ON c.user_id = e.club_id
       WHERE e.approval_status = 'pending'
       ORDER BY e.created_at DESC
       LIMIT 6`
    ),
    Message.countDocuments({}).exec(),
    Media.countDocuments({}).exec()
  ]);

  return {
    role: "admin",
    summary: {
      ...userCounts[0],
      ...eventCounts[0],
      ...collaborationCounts[0],
      totalMessages,
      totalMedia
    },
    recentUsers,
    pendingEvents
  };
}

const getDashboard = asyncHandler(async (req, res) => {
  let dashboard;

  if (req.user.role === "club") {
    dashboard = await buildClubDashboard(req.user.id);
  }

  if (req.user.role === "company") {
    dashboard = await buildCompanyDashboard(req.user.id);
  }

  if (req.user.role === "admin") {
    dashboard = await buildAdminDashboard();
  }

  return res.json(dashboard);
});

module.exports = {
  getDashboard
};
