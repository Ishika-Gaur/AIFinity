import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import assessmentRoutes from "./routes/assessmentRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import personalIntelligenceRoutes from "./routes/personalIntelligenceRoutes.js";
import conceptRootRoutes from "./routes/conceptRootRoutes.js";
import mistakeMapRoutes from "./routes/mistakeMapRoutes.js";
import skillGapRoutes from "./routes/skillGapRoutes.js";
import { authenticate, isAdmin } from "./middleware/authMiddleware.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/aifinity";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const allowedOrigins = CLIENT_URL.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (!allowedOrigins.includes("https://aifinity-frontend.onrender.com")) {
  allowedOrigins.push("https://aifinity-frontend.onrender.com");
}

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      // Allow any localhost port in development
      if (process.env.NODE_ENV !== "production" && origin.match(/^http:\/\/localhost:\d+$/)) {
        return callback(null, true);
      }
      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: "Too many requests from this IP, please try again later."
});
app.use(limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/personal-intelligence", personalIntelligenceRoutes);
app.use("/api/concept-root", conceptRootRoutes);
app.use("/api/mistake-map", mistakeMapRoutes);
app.use("/api/skill-gap", skillGapRoutes);

// Protected Admin Test Route
app.get("/api/admin/test", authenticate, isAdmin, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Admin authorization verified successfully.",
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// Return a useful API response when a client sends malformed JSON.
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON request body.",
    });
  }
  return next(err);
});

// MongoDB Connection & Server Launch
export async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log(`Connected to MongoDB successfully at ${MONGODB_URI}`);

    // Ensure Mongoose models sync indexes (e.g. partial unique index on role: "admin")
    await mongoose.model("User").syncIndexes();
    console.log("MongoDB User indexes synchronized successfully.");

    const server = app.listen(PORT, () => {
      console.log(`AIFinity Express server running on port ${PORT}`);
    });
    return server;
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== "test") {
  startServer();
}

export default app;
