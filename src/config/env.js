const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

module.exports = {
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || "change-me-in-production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:4000",
  publicDir: path.resolve(process.cwd(), "public"),
  uploadsDir: path.resolve(process.cwd(), "uploads"),
  mysql: {
    host: process.env.MYSQL_HOST || "127.0.0.1",
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "campussponsor"
  },
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/campussponsor",
  adminSeedEmail: process.env.ADMIN_SEED_EMAIL || "",
  adminSeedPassword: process.env.ADMIN_SEED_PASSWORD || "",
  adminSeedName: process.env.ADMIN_SEED_NAME || "CampusSponsor Admin"
};
