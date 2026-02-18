const { query } = require("../config/mysql");

async function getUserWithProfile(userId) {
  const users = await query(
    "SELECT id, name, email, role, created_at AS createdAt FROM users WHERE id = ?",
    [userId]
  );

  if (!users.length) {
    return null;
  }

  const user = users[0];
  let profile = {};

  if (user.role === "club") {
    const clubs = await query(
      `SELECT college_name AS collegeName, club_name AS clubName, description,
              past_events AS pastEvents, audience_size AS audienceSize
       FROM clubs
       WHERE user_id = ?`,
      [userId]
    );
    profile = clubs[0] || {};
  }

  if (user.role === "company") {
    const companies = await query(
      `SELECT company_name AS companyName, industry, marketing_goals AS marketingGoals,
              budget_range AS budgetRange
       FROM companies
       WHERE user_id = ?`,
      [userId]
    );
    profile = companies[0] || {};
  }

  return {
    ...user,
    profile
  };
}

module.exports = {
  getUserWithProfile
};

