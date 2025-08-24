import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import axios from 'axios';
import { v2 as cloudinary } from 'cloudinary';
import Tesseract from 'tesseract.js';
import { GoogleGenerativeAI } from "@google/generative-ai";  // ✅ Gemini SDK
import User from './models/User.js';

const app = express();
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

// ---------------------- MongoDB ----------------------
mongoose.connect('mongodb://localhost:27017/receipt_carbon')
  .then(() => console.log('Mongo connected'))
  .catch(err => console.error(err));

// ---------------------- Cloudinary ----------------------
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME || 'dhfyarphc',
  api_key: process.env.CLOUD_KEY || '537316744387757',
  api_secret: process.env.CLOUD_SECRET || '5VB_SHQtJMO-hsoR02jXcOJDtug'
});

// ---------------------- Multer ----------------------
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ---------------------- Auth Middleware ----------------------
const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ msg: 'Missing token' });
  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'divyansh');
    next();
  } catch {
    return res.status(401).json({ msg: 'Invalid token' });
  }
};
app.get("/api/user/me", authMiddleware, async (req, res) => {
  try {
    // req.user contains the decoded JWT payload (with userId)
    const user = await User.findById(req.user.id).select("-password"); // exclude password
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    res.json(user);
  } catch (err) {
    console.error("Error in /api/user/me:", err);
    res.status(500).json({ msg: "Server error" });
  }
});
// ---------------------- Gemini Function ----------------------
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSyBnat6WhcEG9d5gJYc2QP46OFI25sHrTkc"); // 👈 use .env

async function generateWithGemini(prompt) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Gemini Error:", error.message);
    return "❌ Gemini request failed.";
  }
}
function cleanExtractedText(rawText) {
  return rawText
    .replace(/workerId.*|jobId.*|status.*|progress.*|userJobId.*/gi, "") // remove Tesseract logs
    .replace(/[^a-zA-Z0-9.,:;()₹$%+\- ]/g, " ") // keep only meaningful chars
    .replace(/\s+/g, " ") // collapse multiple spaces
    .replace(/ {2,}/g, " ") // extra space fix
    .trim();
}
// ---------------------- OCR Text Extraction ----------------------
async function extractTextOCR(imageUrl) {
  try {
    const { data: { text } } = await Tesseract.recognize(imageUrl, 'eng', { logger: m => console.log(m) });
    const cleanedText = cleanExtractedText(text)
    console.log("📄 Extracted & cleaned text:\n", cleanedText);
    return cleanedText;
  } catch (err) {
    console.error("❌ OCR extraction failed:", err.message);
    return "";
  }
}

// ---------------------- Upload + Extract + Carbon + Gemini ----------------------
app.post("/api/carbon/upload", upload.single("receipt"), async (req, res) => {
  try {
    const userId = req.body.userId;
    if (!req.file) return res.status(400).json({ success: false, error: "No file uploaded" });
    if (!userId) return res.status(400).json({ success: false, error: "User ID required" });

    // Sanitize filename
    const publicId = req.file.originalname.replace(/\s+/g, "_").split(".")[0];
    let cloudUrl = "";

    // ------------------ Cloudinary upload/check ------------------
    try {
      const result = await cloudinary.api.resource(`receipts/${publicId}`);
      cloudUrl = result.secure_url;
      console.log("✅ Image already exists:", cloudUrl);
    } catch (err) {
      const uploadRes = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "receipts", public_id: publicId },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });
      cloudUrl = uploadRes.secure_url;
      console.log("✅ Uploaded new image:", cloudUrl);
    }

    // ------------------ OCR extraction ------------------
    const extractedText = await extractTextOCR(cloudUrl);
    console.log("📄 OCR extracted text:\n", extractedText);

    // ------------------ Gemini cleanup / extract items ------------------
  const geminiPrompt = `
From the following receipt text, extract only the food item names along with their quantities 
(ignore prices, GST, waiter, etc). Format each item like: "Item Name - Quantity".

Receipt text: "${extractedText}"

Return as a simple list of items with quantities.
`;
    const geminiSummary = await generateWithGemini(geminiPrompt);
    console.log("✍️ Cleaned items from Gemini:\n", geminiSummary);

    // ------------------ Carbon calculation ------------------
    const pythonRes = await axios.post("http://127.0.0.1:5000/calculate", { text: geminiSummary });
    const totalCarbon = pythonRes.data.carbon_emission_total || 0;
    console.log("💨 Total carbon:",  totalCarbon);

    // ------------------ Save to user ------------------
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    user.carbonEntries.push({ totalCarbon, date: new Date() });
    await user.save();

    // ------------------ Response ------------------
    res.json({ 
      success: true, 
      message: "Carbon footprint stored!", 
      totalCarbon, 
      geminiSummary 
    });

  } catch (err) {
    console.error("❌ Upload error:", err.message, err.stack);
    res.status(500).json({ success: false, error: "Error processing receipt" });
  }
});

// ---------------------- User Carbon History ----------------------
app.get("/api/carbon/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    const sortedEntries = user.carbonEntries.sort((a, b) => b.date - a.date);
    res.json({ success: true, carbonEntries: sortedEntries });
  } catch (err) {
    console.error("❌ Error fetching carbon data:", err.message);
    res.status(500).json({ success: false, error: "Server error" });
  }
});
// ---------------------- Auth Routes ----------------------

// Signup
app.post('/api/signup', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // check existing
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      cart: [],
      carbonEntries: []
    });
    await newUser.save();

    res.status(201).json({ message: "Signup successful" });
  } catch (error) {
    console.error("❌ Signup error:", error.message);
    res.status(500).json({ message: "Signup failed" });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const user = await User.findOne({ name: username });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, "divyansh", { expiresIn: "3d" });

    res.json({ token, name: user.name, email: user.email, message:"success" });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error });
  }
});
// Get current user info


// ---------------------- Start Server ----------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log('Backend running on', PORT));