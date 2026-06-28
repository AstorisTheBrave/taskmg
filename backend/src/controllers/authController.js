const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { z } = require("zod");
const prisma = require("../db");
const { ValidationError, UnauthorizedError } = require("../utils/errors");
const { logActivity } = require("../utils/activity");

const signupSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  inviteCode: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "8h",
  });
}

async function signup(req, res, next) {
  try {
    const data = signupSchema.parse(req.body);

    if (data.inviteCode !== process.env.INVITE_CODE) {
      return next(new ValidationError("Invalid invite code"));
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: passwordHash,
        role: "MEMBER",
      },
    });

    await logActivity({ userId: user.id, action: "USER_CREATED" });

    const token = signToken(user);
    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    if (err instanceof z.ZodError) return next(new ValidationError(err.errors[0].message));
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) return next(new UnauthorizedError("Invalid credentials"));

    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) return next(new UnauthorizedError("Invalid credentials"));

    const token = signToken(user);
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    if (err instanceof z.ZodError) return next(new ValidationError(err.errors[0].message));
    next(err);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const data = forgotPasswordSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email } });

    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetTokenHash: hashToken(token),
          resetTokenExpiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
        },
      });

      const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${token}`;
      console.log(`[password reset] ${user.email} -> ${resetUrl} (expires in 30 min)`);

      await logActivity({ userId: user.id, action: "PASSWORD_RESET_REQUESTED" });
    }

    res.json({ message: "If that account exists, a reset link has been generated. Ask your admin for it." });
  } catch (err) {
    if (err instanceof z.ZodError) return next(new ValidationError(err.errors[0].message));
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const data = resetPasswordSchema.parse(req.body);
    const tokenHash = hashToken(data.token);

    const user = await prisma.user.findFirst({
      where: { resetTokenHash: tokenHash, resetTokenExpiresAt: { gt: new Date() } },
    });

    if (!user) return next(new ValidationError("Invalid or expired reset token"));

    const passwordHash = await bcrypt.hash(data.password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: passwordHash, resetTokenHash: null, resetTokenExpiresAt: null },
    });

    await logActivity({ userId: user.id, action: "PASSWORD_RESET_COMPLETED" });

    res.json({ message: "Password updated. You can now sign in." });
  } catch (err) {
    if (err instanceof z.ZodError) return next(new ValidationError(err.errors[0].message));
    next(err);
  }
}

module.exports = { signup, login, forgotPassword, resetPassword };
