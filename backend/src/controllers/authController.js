const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
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

module.exports = { signup, login };
