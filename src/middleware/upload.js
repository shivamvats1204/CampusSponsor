const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const env = require("../config/env");

function createStorage(folder) {
  return multer.diskStorage({
    destination: (_req, _file, callback) => {
      const targetDirectory = path.join(env.uploadsDir, folder);
      fs.mkdirSync(targetDirectory, { recursive: true });
      callback(null, targetDirectory);
    },
    filename: (_req, file, callback) => {
      const extension = path.extname(file.originalname);
      callback(null, `${Date.now()}-${crypto.randomUUID()}${extension}`);
    }
  });
}

function sharedFileFilter(_req, file, callback) {
  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "video/mp4",
    "video/webm",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    return callback(new Error("Unsupported file type."));
  }

  return callback(null, true);
}

function toPublicFilePath(file) {
  if (!file) {
    return null;
  }

  const folderName = path.basename(path.dirname(file.path));
  return `/uploads/${folderName}/${file.filename}`;
}

const commonOptions = {
  fileFilter: sharedFileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }
};

const eventUpload = multer({
  storage: createStorage("events"),
  ...commonOptions
});

const mediaUpload = multer({
  storage: createStorage("media"),
  ...commonOptions
});

const messageUpload = multer({
  storage: createStorage("messages"),
  ...commonOptions
});

module.exports = {
  eventUpload,
  mediaUpload,
  messageUpload,
  toPublicFilePath
};
