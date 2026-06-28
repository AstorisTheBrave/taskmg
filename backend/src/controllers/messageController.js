const { z } = require("zod");
const prisma = require("../db");
const { ValidationError } = require("../utils/errors");

const createSchema = z.object({
  content: z.string().min(1).max(2000),
});

async function list(req, res, next) {
  try {
    const messages = await prisma.message.findMany({
      orderBy: { createdAt: "asc" },
      take: 200,
      include: { user: { select: { id: true, name: true } } },
    });
    res.json(messages);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const data = createSchema.parse(req.body);

    const message = await prisma.message.create({
      data: { userId: req.user.id, content: data.content },
      include: { user: { select: { id: true, name: true } } },
    });

    res.status(201).json(message);
  } catch (err) {
    if (err instanceof z.ZodError) return next(new ValidationError(err.errors[0].message));
    next(err);
  }
}

module.exports = { list, create };
