const { query } = require("../config/mysql");
const asyncHandler = require("../utils/asyncHandler");

const getUsers = asyncHandler(async (_req, res) => {
  const users = await query(
    `SELECT u.id, u.name, u.email, u.role, u.created_at AS createdAt,
            c.club_name AS clubName, c.college_name AS collegeName,
            co.company_name AS companyName, co.industry
     FROM users u
     LEFT JOIN clubs c ON c.user_id = u.id
     LEFT JOIN companies co ON co.user_id = u.id
     ORDER BY u.created_at DESC`
  );

  return res.json({ users });
});

const getPendingEvents = asyncHandler(async (_req, res) => {
  const events = await query(
    `SELECT e.id, e.title, e.category, e.location, e.event_date AS eventDate,
            e.approval_status AS approvalStatus, c.club_name AS clubName
     FROM events e
     INNER JOIN clubs c ON c.user_id = e.club_id
     WHERE e.approval_status = 'pending'
     ORDER BY e.created_at DESC`
  );

  return res.json({ events });
});

const updateEventApproval = asyncHandler(async (req, res) => {
  const { approvalStatus } = req.body;

  if (!["approved", "rejected", "pending"].includes(approvalStatus)) {
    return res.status(400).json({ message: "Invalid approval status." });
  }

  const result = await query("UPDATE events SET approval_status = ? WHERE id = ?", [
    approvalStatus,
    Number(req.params.id)
  ]);

  if (!result.affectedRows) {
    return res.status(404).json({ message: "Event not found." });
  }

  return res.json({ message: "Event status updated successfully." });
});

const deleteUser = asyncHandler(async (req, res) => {
  const userId = Number(req.params.id);

  if (req.user.id === userId) {
    return res.status(400).json({ message: "Admins cannot delete their own account here." });
  }

  const result = await query("DELETE FROM users WHERE id = ?", [userId]);
  if (!result.affectedRows) {
    return res.status(404).json({ message: "User not found." });
  }

  return res.json({ message: "User deleted successfully." });
});

module.exports = {
  getUsers,
  getPendingEvents,
  updateEventApproval,
  deleteUser
};

