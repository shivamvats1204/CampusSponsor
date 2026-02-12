const bcrypt = require("bcryptjs");
const { pool, query } = require("../config/mysql");
const asyncHandler = require("../utils/asyncHandler");
const { signToken } = require("../utils/jwt");
const { getUserWithProfile } = require("../services/profileService");

const register = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    role,
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

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: "Name, email, password, and role are required." });
  }

  if (!["club", "company"].includes(role)) {
    return res.status(400).json({ message: "Only club and company accounts can self-register." });
  }

  const existingUsers = await query("SELECT id FROM users WHERE email = ?", [email]);
  if (existingUsers.length) {
    return res.status(409).json({ message: "An account already exists with that email." });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const connection = await pool.getConnection();
  let userId;

  try {
    await connection.beginTransaction();

    const [userResult] = await connection.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, passwordHash, role]
    );
    userId = userResult.insertId;

    if (role === "club") {
      await connection.query(
        `INSERT INTO clubs (user_id, college_name, club_name, description, past_events, audience_size)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          userId,
          collegeName || "Unknown College",
          clubName || name,
          description || "",
          pastEvents || "",
          Number(audienceSize || 0)
        ]
      );
    }

    if (role === "company") {
      await connection.query(
        `INSERT INTO companies (user_id, company_name, industry, marketing_goals, budget_range)
         VALUES (?, ?, ?, ?, ?)`,
        [
          userId,
          companyName || name,
          industry || "",
          marketingGoals || "",
          budgetRange || ""
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

  const token = signToken(userId);
  const user = await getUserWithProfile(userId);

  return res.status(201).json({ token, user });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  const users = await query("SELECT * FROM users WHERE email = ?", [email]);
  const user = users[0];

  if (!user) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  const token = signToken(user.id);
  const fullUser = await getUserWithProfile(user.id);

  return res.json({ token, user: fullUser });
});

const logout = asyncHandler(async (_req, res) => {
  return res.json({ message: "Logged out successfully." });
});

const me = asyncHandler(async (req, res) => {
  const user = await getUserWithProfile(req.user.id);
  return res.json({ user });
});

module.exports = {
  register,
  login,
  logout,
  me
};
