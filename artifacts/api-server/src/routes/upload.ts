import { Router } from "express";
import fs from "fs";
import path from "path";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

// Ensure upload directory exists
const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");
const COVERS_DIR = path.join(UPLOADS_DIR, "covers");

if (!fs.existsSync(COVERS_DIR)) {
  fs.mkdirSync(COVERS_DIR, { recursive: true });
}

// POST /upload/cover — Upload image as base64 string or binary
router.post("/upload/cover", requireAuth, requireRole("admin", "librarian"), async (req, res) => {
  try {
    const { imageBase64, filename: originalName } = req.body as { imageBase64?: string; filename?: string };

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return res.status(400).json({ error: "imageBase64 is required" });
    }

    // Match data URI header (e.g. data:image/png;base64,...)
    const matches = imageBase64.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    let ext = "png";
    let base64Data = imageBase64;

    if (matches) {
      ext = matches[1] === "jpeg" ? "jpg" : matches[1];
      base64Data = matches[2];
    } else if (originalName) {
      const parts = originalName.split(".");
      if (parts.length > 1) ext = parts.pop() || "png";
    }

    const filename = `cover_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const filePath = path.join(COVERS_DIR, filename);

    const buffer = Buffer.from(base64Data, "base64");
    await fs.promises.writeFile(filePath, buffer);

    const coverUrl = `/uploads/covers/${filename}`;
    return res.status(201).json({ coverUrl, filename });
  } catch (err: any) {
    req.log?.error({ err }, "Failed to upload cover image");
    return res.status(500).json({ error: "Failed to upload image: " + (err.message || "Unknown error") });
  }
});

// POST /upload/file — Upload general file (PDF, etc) as base64 string
router.post("/upload/file", requireAuth, requireRole("admin", "librarian"), async (req, res) => {
  try {
    const { fileBase64, filename: originalName } = req.body as { fileBase64?: string; filename?: string };

    if (!fileBase64 || typeof fileBase64 !== "string") {
      return res.status(400).json({ error: "fileBase64 is required" });
    }

    // Match data URI header (e.g. data:application/pdf;base64,...)
    const matches = fileBase64.match(/^data:(.+?);base64,(.+)$/);
    let ext = "pdf";
    let base64Data = fileBase64;

    if (matches) {
      base64Data = matches[2];
      const mime = matches[1];
      if (mime === "application/epub+zip") ext = "epub";
      else if (mime === "application/msword") ext = "doc";
      else if (mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") ext = "docx";
    }
    
    if (originalName) {
      const parts = originalName.split(".");
      if (parts.length > 1) ext = parts.pop() || ext;
    }

    const filename = `file_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    
    // We can reuse COVERS_DIR or create a separate files directory.
    // Let's create a separate one.
    const FILES_DIR = path.join(UPLOADS_DIR, "files");
    if (!fs.existsSync(FILES_DIR)) {
      fs.mkdirSync(FILES_DIR, { recursive: true });
    }
    
    const filePath = path.join(FILES_DIR, filename);

    const buffer = Buffer.from(base64Data, "base64");
    await fs.promises.writeFile(filePath, buffer);

    const fileUrl = `/uploads/files/${filename}`;
    return res.status(201).json({ fileUrl, filename });
  } catch (err: any) {
    req.log?.error({ err }, "Failed to upload file");
    return res.status(500).json({ error: "Failed to upload file: " + (err.message || "Unknown error") });
  }
});

export default router;
