const { z } = require("zod");
const prisma = require("../db");
const { ValidationError, NotFoundError, ForbiddenError } = require("../utils/errors");
const { logActivity } = require("../utils/activity");

const createSchema = z.object({
  content: z.string().min(1),
});

async function canView(user, taskId) {
  if (user.role === "ADMIN") return true;
  const membership = await prisma.taskAssignee.findUnique({
    where: { taskId_userId: { taskId, userId: user.id } },
  });
  return !!membership;
}

async function list(req, res, next) {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) return next(new NotFoundError("Task not found"));
    if (!(await canView(req.user, task.id))) return next(new ForbiddenError());

    const comments = await prisma.comment.findMany({
      where: { taskId: req.params.id },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: "asc" },
    });
    res.json(comments);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) return next(new NotFoundError("Task not found"));
    if (!(await canView(req.user, task.id))) return next(new ForbiddenError());

    const data = createSchema.parse(req.body);
    const comment = await prisma.comment.create({
      data: { taskId: req.params.id, userId: req.user.id, content: data.content },
      include: { user: { select: { id: true, name: true } } },
    });

    await logActivity({ taskId: task.id, userId: req.user.id, action: "COMMENT_CREATED" });

    res.status(201).json(comment);
  } catch (err) {
    if (err instanceof z.ZodError) return next(new ValidationError(err.errors[0].message));
    next(err);
  }
}

module.exports = { list, create };
