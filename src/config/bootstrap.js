const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const env = require("./env");
const { pool, query } = require("./mysql");

function ensureUploadDirectories() {
  const directories = [
    env.uploadsDir,
    path.join(env.uploadsDir, "events"),
    path.join(env.uploadsDir, "media"),
    path.join(env.uploadsDir, "messages")
  ];

  directories.forEach((directory) => {
    fs.mkdirSync(directory, { recursive: true });
  });
}

async function bootstrapMySql() {
  const schemaPath = path.resolve(__dirname, "..", "services", "schema.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf8");
  await pool.query(schemaSql);
}

async function seedAdminUser() {
  if (!env.adminSeedEmail || !env.adminSeedPassword) {
    return;
  }

  const existingUsers = await query("SELECT id FROM users WHERE email = ?", [env.adminSeedEmail]);
  if (existingUsers.length) {
    return;
  }

  const passwordHash = await bcrypt.hash(env.adminSeedPassword, 10);
  await query(
    "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'admin')",
    [env.adminSeedName, env.adminSeedEmail, passwordHash]
  );
}

async function bootstrapApplication() {
  ensureUploadDirectories();
  await bootstrapMySql();
  await seedAdminUser();
}

module.exports = {
  bootstrapApplication
};
