const { query } = require("../config/mysql");
const asyncHandler = require("../utils/asyncHandler");
const { verifyToken } = require("../utils/jwt");

async function loadUserFromToken(token) {
  const payload = verifyToken(token);
  const users = await query(
    "SELECT id, name, email, role, created_at AS createdAt FROM users WHERE id = ?",
    [payload.userId]
  );

  return users[0] || null;
}

function extractToken(req) {
  const authHeader = req.headers.authorization || "";
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  return req.cookies?.token || null;
}

const authMiddleware = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ message: "Authentication required." });
  }

  try {
    const user = await loadUserFromToken(token);
    if (!user) {
      return res.status(401).json({ message: "User session is no longer valid." });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
});

const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);

  if (!token) {
    return next();
  }

  try {
    const user = await loadUserFromToken(token);
    if (user) {
      req.user = user;
    }
  } catch (error) {
    req.user = null;
  }

  return next();
});

function authorizeRoles(...roles) {
  return function roleAuthorizer(req, res, next) {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "You do not have access to this resource." });
    }

    return next();
  };
}

module.exports = {
  authMiddleware,
  optionalAuth,
  authorizeRoles
};

