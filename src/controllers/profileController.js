const { pool, query } = require("../config/mysql");
const asyncHandler = require("../utils/asyncHandler");
const { getUserWithProfile } = require("../services/profileService");

const getProfile = asyncHandler(async (req, res) => {
  const user = await getUserWithProfile(Number(req.params.id));

  if (!user) {
    return res.status(404).json({ message: "Profile not found." });
  }

  return res.json({ user });
});

const updateProfile = asyncHandler(async (req, res) => {
  const connection = await pool.getConnection();
  const {
    name,
    collegeName,
    clubName,
    description,
    pastEvents,
    audienceSize,
    companyName,
    industry,
    marketingGoals,
    budgetRange
  } = req.body;

  try {
    await connection.beginTransaction();

    if (name) {
      await connection.query("UPDATE users SET name = ? WHERE id = ?", [name, req.user.id]);
    }

    if (req.user.role === "club") {
      await connection.query(
        `UPDATE clubs
         SET college_name = ?, club_name = ?, description = ?, past_events = ?, audience_size = ?
         WHERE user_id = ?`,
        [
          collegeName || "",
          clubName || name || req.user.name,
          description || "",
          pastEvents || "",
          Number(audienceSize || 0),
          req.user.id
        ]
      );
    }

    if (req.user.role === "company") {
      await connection.query(
        `UPDATE companies
         SET company_name = ?, industry = ?, marketing_goals = ?, budget_range = ?
         WHERE user_id = ?`,
        [
          companyName || name || req.user.name,
          industry || "",
          marketingGoals || "",
          budgetRange || "",
          req.user.id
        ]
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  const user = await getUserWithProfile(req.user.id);
  return res.json({ message: "Profile updated successfully.", user });
});

const getPublicProfiles = asyncHandler(async (_req, res) => {
  const users = await query(
    `SELECT id, name, role, created_at AS createdAt
     FROM users
     ORDER BY created_at DESC`
  );
  return res.json({ users });
});

module.exports = {
  getProfile,
  updateProfile,
  getPublicProfiles
};
