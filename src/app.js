const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const env = require("./config/env");
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const eventRoutes = require("./routes/eventRoutes");
const tierRoutes = require("./routes/tierRoutes");
const collaborationRoutes = require("./routes/collaborationRoutes");
const messageRoutes = require("./routes/messageRoutes");
const mediaRoutes = require("./routes/mediaRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const adminRoutes = require("./routes/adminRoutes");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(
  cors({
    origin: env.frontendOrigin.split(",").map((item) => item.trim()),
    credentials: true
  })
);
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/uploads", express.static(env.uploadsDir));
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/tiers", tierRoutes);
app.use("/api/collab", collaborationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/admin", adminRoutes);

if (fs.existsSync(env.publicDir)) {
  app.use(express.static(env.publicDir));

  app.get("/", (_req, res) => {
    res.sendFile(path.join(env.publicDir, "index.html"));
  });

  app.get("/:page", (req, res, next) => {
    if (req.path.startsWith("/api/")) {
      return next();
    }

    const requestedFile = path.join(env.publicDir, req.params.page);
    if (fs.existsSync(requestedFile)) {
      return res.sendFile(requestedFile);
    }

    return next();
  });
}

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
