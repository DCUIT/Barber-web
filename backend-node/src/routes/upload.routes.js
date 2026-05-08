import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { requireAuth, requireRole } from '../middleware/auth.js';
import dotenv from 'dotenv';

dotenv.config();

export const uploadRouter = express.Router();

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cấu hình Multer để xử lý file upload (lưu tạm vào memory)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Endpoint để upload ảnh
uploadRouter.post('/', requireAuth, requireRole(['admin']), upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: 'No image file provided' });

    const b64 = Buffer.from(req.file.buffer).toString("base64");
    let dataUri = "data:" + req.file.mimetype + ";base64," + b64;
    const result = await cloudinary.uploader.upload(dataUri);
    res.json({ imageUrl: result.secure_url });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    res.status(500).json({ msg: 'Image upload failed' });
  }
});