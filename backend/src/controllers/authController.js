import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import User from "../models/User.js";

const getCookieOptions = () => {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  };
};

const generateToken = (userId, role) => {
  const jwtSecret = process.env.JWT_SECRET || "fallback_dev_secret_key_change_in_prod";
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign({ id: userId, role }, jwtSecret, { expiresIn });
};

const formatUserResponse = (user) => ({
  id: user._id || user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  onboardingCompleted: !!user.onboardingCompleted,
  selectedField: user.selectedField || "",
  onboardingProfile: user.onboardingProfile || null,
});

const RESET_LINK_LIFETIME_MS = 15 * 60 * 1000;
const RESET_RESPONSE_MESSAGE = "If an account exists for this email, a reset link has been sent.";

const createMailTransport = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
};

/**
 * Public Student Registration:
 * POST /api/auth/register
 * Force-assigns role: "student". Ignores any client-supplied role.
 */
export async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, and password.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "An account with this email address already exists.",
      });
    }

    const passwordHash = await User.hashPassword(password);

    // CRITICAL: Force role to 'student'. Onboarding is incomplete for new registrants.
    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: "student",
      onboardingCompleted: false,
      selectedField: "",
    });

    const token = generateToken(newUser._id, newUser.role);
    res.cookie("token", token, getCookieOptions());

    return res.status(201).json({
      success: true,
      message: "Account registered successfully.",
      user: formatUserResponse(newUser),
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "An account with this email address already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error during registration.",
    });
  }
}

/**
 * Shared Login Endpoint:
 * POST /api/auth/login
 */
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please enter both email and password.",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+passwordHash");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (user.status === "suspended") {
      return res.status(403).json({ success: false, message: "This account has been suspended." });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = generateToken(user._id, user.role);
    res.cookie("token", token, getCookieOptions());

    return res.status(200).json({
      success: true,
      message: "Logged in successfully.",
      user: formatUserResponse(user),
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error during login.",
    });
  }
}

/**
 * Logout Endpoint:
 * POST /api/auth/logout
 */
export async function logout(req, res) {
  res.clearCookie("token", getCookieOptions());
  return res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
}

/**
 * Complete Onboarding Endpoint:
 * PUT /api/auth/onboarding
 * Saves field selection (only once) and marks onboardingCompleted = true permanently.
 */
export async function completeOnboarding(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Not authenticated." });
    }

    const { field, careerGoal, level } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Rule 2: Choose career field ONLY ONCE. If field is already set in DB, prevent overwriting.
    if (!user.selectedField && field) {
      user.selectedField = String(field).trim();
    }

    user.onboardingCompleted = true;
    user.onboardingProfile = {
      field: user.selectedField || field || "",
      careerGoal: careerGoal || user.selectedField || "",
      level: level || "Intermediate",
    };

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Onboarding completed successfully.",
      user: formatUserResponse(user),
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to save onboarding completion.",
    });
  }
}

/**
 * Update Profile Endpoint:
 * PUT /api/auth/profile
 * Allows user to update their name, target field, level, and career goal.
 */
export async function updateProfile(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Not authenticated." });
    }

    const { name, field, careerGoal, level } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (name) {
      user.name = name.trim();
    }

    if (field) {
      user.selectedField = String(field).trim();
    }

    user.onboardingProfile = {
      field: user.selectedField || user.onboardingProfile?.field || "",
      careerGoal: careerGoal || user.onboardingProfile?.careerGoal || "",
      level: level || user.onboardingProfile?.level || "Intermediate",
    };

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: formatUserResponse(user),
    });
  } catch (err) {
    console.error("Profile update error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to update profile.",
    });
  }
}

/**
 * POST /api/auth/forgot-password
 */
export async function forgotPassword(req, res) {
  try {
    const email = req.body.email?.toLowerCase().trim();
    if (!email) {
      return res.status(400).json({ success: false, message: "Please enter your email address." });
    }

    const user = await User.findOne({ email }).select("+resetPasswordToken +resetPasswordExpires");
    if (!user) {
      return res.status(200).json({ success: true, message: RESET_RESPONSE_MESSAGE });
    }

    const transport = createMailTransport();
    const rawToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    user.resetPasswordExpires = new Date(Date.now() + RESET_LINK_LIFETIME_MS);
    await user.save({ validateBeforeSave: false });

    const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
    const resetUrl = `${clientUrl}/reset-password/${rawToken}`;

    if (!transport) {
      console.log(`\n==================================================`);
      console.log(`[AIFINITY DEV PASSWORD RESET LINK]`);
      console.log(`User: ${email}`);
      console.log(`Reset Link: ${resetUrl}`);
      console.log(`==================================================\n`);

      return res.status(200).json({
        success: true,
        message: RESET_RESPONSE_MESSAGE,
        devResetUrl: process.env.NODE_ENV === "development" ? resetUrl : undefined,
      });
    }

    try {
      await transport.sendMail({
        from: process.env.MAIL_FROM || process.env.SMTP_USER,
        to: user.email,
        subject: "Reset your AIFINITY password",
        text: `You requested a password reset. Open this link within 15 minutes: ${resetUrl}`,
        html: `<p>You requested a password reset for your AIFINITY account.</p><p><a href="${resetUrl}">Click here to reset your password</a></p><p>This link expires in 15 minutes.</p>`,
      });
    } catch (mailError) {
      console.error("Mail send error:", mailError.message);
    }

    return res.status(200).json({
      success: true,
      message: RESET_RESPONSE_MESSAGE,
      devResetUrl: process.env.NODE_ENV === "development" ? resetUrl : undefined,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Unable to send the reset email. Please try again later." });
  }
}

/**
 * POST /api/auth/reset-password/:token
 */
export async function resetPassword(req, res) {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters long." });
    }

    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    }).select("+passwordHash +resetPasswordToken +resetPasswordExpires");

    if (!user) {
      return res.status(400).json({ success: false, message: "This reset link is invalid or has expired." });
    }

    user.passwordHash = await User.hashPassword(password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).json({ success: true, message: "Your password has been reset. You can now log in." });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Unable to reset the password. Please try again later." });
  }
}

/**
 * Current User Endpoint:
 * GET /api/auth/me
 */
export async function getMe(req, res) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated.",
    });
  }

  return res.status(200).json({
    success: true,
    user: formatUserResponse(req.user),
  });
}
