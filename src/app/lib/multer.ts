import multer from "multer";

// Set up Multer for handling file uploads
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 6,
  },
  fileFilter: (_req, file, callback) => {
    const supported = ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype);
    callback(supported ? null : new Error("Only JPG, PNG, and WebP images are accepted."), supported);
  },
});
