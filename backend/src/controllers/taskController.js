const { z } = require("zod");
const prisma = require("../db");
const { ValidationError, NotFoundError, ForbiddenError } = require("../utils/errors");
const { logActivity } = require("../utils/activity");

const STATUSES = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH"];

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(PRIORITIES),
  assignedTo: z.string().uuid(),
  dueDate: z.coerce.date().optional(),
});

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  priority: z.enum(PRIORITIES).optional(),
  dueDate: z.coerce.date().optional(),
});

const statusSchema = z.object({
  status: z.enum(STATUSES),
});

const assignSchema = z.object({
  assignedTo: z.string().uuid(),
});

function canView(user, task) {
  return user.role === "ADMIN" || task.assignedTo === user.id;
}

function canModify(user, task) {
  return user.role === "ADMIN" || task.assignedTo === user.id;
}

async function list(req, res, next) {
  try {
    const { search, status, priority } = req.query;

    const where = {
      ...(req.user.role === "ADMIN" ? {} : { assignedTo: req.user.id }),
      ...(status && STATUSES.includes(status) ? { status } : {}),
      ...(priority && PRIORITIES.includes(priority) ? { priority } : {}),
      ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
    };

    const tasks = await prisma.task.findMany({ where, orderBy: { createdAt: "desc" } });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) return next(new NotFoundError("Task not found"));
    if (!canView(req.user, task)) return next(new ForbiddenError());
    res.json(task);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    if (req.user.role !== "ADMIN") return next(new ForbiddenError());

    const data = createSchema.parse(req.body);

    const assignee = await prisma.user.findUnique({ where: { id: data.assignedTo } });
    if (!assignee) return next(new ValidationError("assigned_to must exist"));

    const task = await prisma.task.create({
      data: { ...data, createdBy: req.user.id },
    });

    await logActivity({ taskId: task.id, userId: req.user.id, action: "TASK_CREATED" });

    res.status(201).json(task);
  } catch (err) {
    if (err instanceof z.ZodError) return next(new ValidationError(err.errors[0].message));
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const existing = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!existing) return next(new NotFoundError("Task not found"));
    if (!canModify(req.user, existing)) return next(new ForbiddenError());

    const data = updateSchema.parse(req.body);
    const task = await prisma.task.update({ where: { id: req.params.id }, data });

    await logActivity({ taskId: task.id, userId: req.user.id, action: "TASK_UPDATED" });

    res.json(task);
  } catch (err) {
    if (err instanceof z.ZodError) return next(new ValidationError(err.errors[0].message));
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    if (req.user.role !== "ADMIN") return next(new ForbiddenError());

    const existing = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!existing) return next(new NotFoundError("Task not found"));

    await prisma.task.delete({ where: { id: req.params.id } });

    await logActivity({ taskId: req.params.id, userId: req.user.id, action: "TASK_DELETED" });

    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

async function assign(req, res, next) {
  try {
    if (req.user.role !== "ADMIN") return next(new ForbiddenError());

    const existing = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!existing) return next(new NotFoundError("Task not found"));

    const data = assignSchema.parse(req.body);
    const assignee = await prisma.user.findUnique({ where: { id: data.assignedTo } });
    if (!assignee) return next(new ValidationError("assigned_to must exist"));

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: { assignedTo: data.assignedTo },
    });

    await logActivity({
      taskId: task.id,
      userId: req.user.id,
      action: "TASK_ASSIGNED",
      metadata: { assignedTo: data.assignedTo },
    });

    res.json(task);
  } catch (err) {
    if (err instanceof z.ZodError) return next(new ValidationError(err.errors[0].message));
    next(err);
  }
}

async function setStatus(req, res, next) {
  try {
    const existing = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!existing) return next(new NotFoundError("Task not found"));
    if (!canModify(req.user, existing)) return next(new ForbiddenError());

    const data = statusSchema.parse(req.body);
    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: { status: data.status },
    });

    await logActivity({
      taskId: task.id,
      userId: req.user.id,
      action: "TASK_STATUS_CHANGED",
      metadata: { status: data.status },
    });

    res.json(task);
  } catch (err) {
    if (err instanceof z.ZodError) return next(new ValidationError(err.errors[0].message));
    next(err);
  }
}

module.exports = { list, getById, create, update, remove, assign, setStatus };
