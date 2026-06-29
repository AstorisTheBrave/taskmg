const { z } = require("zod");
const prisma = require("../db");
const { ValidationError, NotFoundError, ForbiddenError } = require("../utils/errors");
const { logActivity } = require("../utils/activity");

const STATUSES = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH"];

const TASK_INCLUDE = {
  assignees: { include: { user: { select: { id: true, name: true } } } },
  creator: { select: { id: true, name: true } },
  reviewer: { select: { id: true, name: true } },
};

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(PRIORITIES),
  assigneeIds: z.array(z.string().uuid()).min(1, "At least one assignee is required"),
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
  assigneeIds: z.array(z.string().uuid()).min(1, "At least one assignee is required"),
});

const submitReviewSchema = z.object({
  completionLink: z.string().url().optional().or(z.literal("")),
  completionNote: z.string().optional(),
});

const rejectSchema = z.object({
  note: z.string().optional(),
});

function serializeTask(task) {
  return {
    ...task,
    assignees: task.assignees.map((a) => a.user),
  };
}

function isAssignee(user, task) {
  return task.assignees.some((a) => a.user.id === user.id);
}

function canView(user, task) {
  return user.role === "ADMIN" || isAssignee(user, task);
}

function canModify(user, task) {
  return user.role === "ADMIN" || isAssignee(user, task);
}

async function validateAssigneeIds(ids) {
  const users = await prisma.user.findMany({ where: { id: { in: ids } } });
  if (users.length !== ids.length) {
    throw new ValidationError("One or more assignees do not exist");
  }
}

async function list(req, res, next) {
  try {
    const { search, status, priority } = req.query;

    const where = {
      ...(req.user.role === "ADMIN" ? {} : { assignees: { some: { userId: req.user.id } } }),
      ...(status && STATUSES.includes(status) ? { status } : {}),
      ...(priority && PRIORITIES.includes(priority) ? { priority } : {}),
      ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
    };

    const tasks = await prisma.task.findMany({ where, include: TASK_INCLUDE, orderBy: { createdAt: "desc" } });
    res.json(tasks.map(serializeTask));
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id }, include: TASK_INCLUDE });
    if (!task) return next(new NotFoundError("Task not found"));
    if (!canView(req.user, task)) return next(new ForbiddenError());
    res.json(serializeTask(task));
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    if (req.user.role !== "ADMIN") return next(new ForbiddenError());

    const data = createSchema.parse(req.body);
    await validateAssigneeIds(data.assigneeIds);

    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority,
        dueDate: data.dueDate,
        createdBy: req.user.id,
        assignees: { create: data.assigneeIds.map((userId) => ({ userId })) },
      },
      include: TASK_INCLUDE,
    });

    await logActivity({ taskId: task.id, userId: req.user.id, action: "TASK_CREATED" });

    res.status(201).json(serializeTask(task));
  } catch (err) {
    if (err instanceof z.ZodError) return next(new ValidationError(err.errors[0].message));
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const existing = await prisma.task.findUnique({ where: { id: req.params.id }, include: TASK_INCLUDE });
    if (!existing) return next(new NotFoundError("Task not found"));
    if (!canModify(req.user, existing)) return next(new ForbiddenError());

    const data = updateSchema.parse(req.body);
    const task = await prisma.task.update({ where: { id: req.params.id }, data, include: TASK_INCLUDE });

    await logActivity({ taskId: task.id, userId: req.user.id, action: "TASK_UPDATED" });

    res.json(serializeTask(task));
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

    await prisma.$transaction([
      prisma.taskAssignee.deleteMany({ where: { taskId: req.params.id } }),
      prisma.comment.deleteMany({ where: { taskId: req.params.id } }),
      prisma.activityLog.updateMany({ where: { taskId: req.params.id }, data: { taskId: null } }),
      prisma.task.delete({ where: { id: req.params.id } }),
    ]);

    await logActivity({
      userId: req.user.id,
      action: "TASK_DELETED",
      metadata: { deletedTaskId: req.params.id, title: existing.title },
    });

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
    await validateAssigneeIds(data.assigneeIds);

    await prisma.$transaction([
      prisma.taskAssignee.deleteMany({ where: { taskId: req.params.id } }),
      prisma.taskAssignee.createMany({
        data: data.assigneeIds.map((userId) => ({ taskId: req.params.id, userId })),
      }),
    ]);

    const task = await prisma.task.findUnique({ where: { id: req.params.id }, include: TASK_INCLUDE });

    await logActivity({
      taskId: task.id,
      userId: req.user.id,
      action: "TASK_ASSIGNED",
      metadata: { assigneeIds: data.assigneeIds },
    });

    res.json(serializeTask(task));
  } catch (err) {
    if (err instanceof z.ZodError) return next(new ValidationError(err.errors[0].message));
    next(err);
  }
}

async function setStatus(req, res, next) {
  try {
    if (req.user.role !== "ADMIN") return next(new ForbiddenError());

    const existing = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!existing) return next(new NotFoundError("Task not found"));

    const data = statusSchema.parse(req.body);
    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: { status: data.status },
      include: TASK_INCLUDE,
    });

    await logActivity({
      taskId: task.id,
      userId: req.user.id,
      action: "TASK_STATUS_CHANGED",
      metadata: { status: data.status },
    });

    res.json(serializeTask(task));
  } catch (err) {
    if (err instanceof z.ZodError) return next(new ValidationError(err.errors[0].message));
    next(err);
  }
}

async function start(req, res, next) {
  try {
    const existing = await prisma.task.findUnique({ where: { id: req.params.id }, include: TASK_INCLUDE });
    if (!existing) return next(new NotFoundError("Task not found"));
    if (!canModify(req.user, existing)) return next(new ForbiddenError());
    if (existing.status !== "TODO") {
      return next(new ValidationError("Task must be in Todo to mark it as taken"));
    }

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: { status: "IN_PROGRESS" },
      include: TASK_INCLUDE,
    });

    await logActivity({ taskId: task.id, userId: req.user.id, action: "TASK_STARTED" });

    res.json(serializeTask(task));
  } catch (err) {
    next(err);
  }
}

async function submitReview(req, res, next) {
  try {
    const existing = await prisma.task.findUnique({ where: { id: req.params.id }, include: TASK_INCLUDE });
    if (!existing) return next(new NotFoundError("Task not found"));
    if (!canModify(req.user, existing)) return next(new ForbiddenError());
    if (existing.status !== "IN_PROGRESS") {
      return next(new ValidationError("Task must be in progress to submit it for review"));
    }

    const data = submitReviewSchema.parse(req.body);

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        status: "REVIEW",
        completionLink: data.completionLink || null,
        completionNote: data.completionNote || null,
      },
      include: TASK_INCLUDE,
    });

    await logActivity({ taskId: task.id, userId: req.user.id, action: "TASK_SUBMITTED_FOR_REVIEW" });

    res.json(serializeTask(task));
  } catch (err) {
    if (err instanceof z.ZodError) return next(new ValidationError(err.errors[0].message));
    next(err);
  }
}

async function approve(req, res, next) {
  try {
    if (req.user.role !== "ADMIN") return next(new ForbiddenError());

    const existing = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!existing) return next(new NotFoundError("Task not found"));
    if (existing.status !== "REVIEW") {
      return next(new ValidationError("Task must be in review to approve it"));
    }

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: { status: "DONE", reviewedBy: req.user.id, reviewedAt: new Date() },
      include: TASK_INCLUDE,
    });

    await logActivity({ taskId: task.id, userId: req.user.id, action: "TASK_APPROVED" });

    res.json(serializeTask(task));
  } catch (err) {
    next(err);
  }
}

async function reject(req, res, next) {
  try {
    if (req.user.role !== "ADMIN") return next(new ForbiddenError());

    const existing = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!existing) return next(new NotFoundError("Task not found"));
    if (existing.status !== "REVIEW") {
      return next(new ValidationError("Task must be in review to reject it"));
    }

    const data = rejectSchema.parse(req.body);

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        status: "IN_PROGRESS",
        completionLink: null,
        completionNote: null,
        reviewedBy: null,
        reviewedAt: null,
      },
      include: TASK_INCLUDE,
    });

    if (data.note) {
      await prisma.comment.create({
        data: { taskId: req.params.id, userId: req.user.id, content: `Sent back for more work: ${data.note}` },
      });
    }

    await logActivity({ taskId: task.id, userId: req.user.id, action: "TASK_REJECTED", metadata: { note: data.note } });

    res.json(serializeTask(task));
  } catch (err) {
    if (err instanceof z.ZodError) return next(new ValidationError(err.errors[0].message));
    next(err);
  }
}

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  assign,
  setStatus,
  start,
  submitReview,
  approve,
  reject,
};
