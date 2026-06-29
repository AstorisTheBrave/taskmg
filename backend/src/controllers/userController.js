const bcrypt = require("bcryptjs");
const { z } = require("zod");
const prisma = require("../db");
const { ValidationError, NotFoundError } = require("../utils/errors");
const { logActivity } = require("../utils/activity");

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "MEMBER"]),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(["ADMIN", "MEMBER"]).optional(),
  password: z.string().min(8).optional(),
});

function serialize(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

async function list(req, res, next) {
  try {
    const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
    res.json(users.map(serialize));
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const data = createSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: { ...data, password: passwordHash },
    });

    await logActivity({ userId: req.user.id, action: "USER_CREATED", metadata: { createdUserId: user.id } });

    res.status(201).json(serialize(user));
  } catch (err) {
    if (err instanceof z.ZodError) return next(new ValidationError(err.errors[0].message));
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const data = updateSchema.parse(req.body);
    if (data.password) data.password = await bcrypt.hash(data.password, 10);

    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) return next(new NotFoundError("User not found"));

    const user = await prisma.user.update({ where: { id: req.params.id }, data });

    await logActivity({ userId: req.user.id, action: "USER_UPDATED", metadata: { updatedUserId: user.id } });

    res.json(serialize(user));
  } catch (err) {
    if (err instanceof z.ZodError) return next(new ValidationError(err.errors[0].message));
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) return next(new NotFoundError("User not found"));

    const createdTaskCount = await prisma.task.count({ where: { createdBy: req.params.id } });
    if (createdTaskCount > 0) {
      return next(
        new ValidationError("Cannot delete a user who has created tasks. Delete or reassign those tasks first.")
      );
    }

    await prisma.$transaction([
      prisma.taskAssignee.deleteMany({ where: { userId: req.params.id } }),
      prisma.task.updateMany({ where: { reviewedBy: req.params.id }, data: { reviewedBy: null } }),
      prisma.comment.deleteMany({ where: { userId: req.params.id } }),
      prisma.activityLog.updateMany({ where: { userId: req.params.id }, data: { userId: null } }),
      prisma.message.deleteMany({ where: { userId: req.params.id } }),
      prisma.user.delete({ where: { id: req.params.id } }),
    ]);

    await logActivity({ userId: req.user.id, action: "USER_DELETED", metadata: { deletedUserId: req.params.id } });

    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, update, remove };
