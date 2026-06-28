const prisma = require("../db");

async function assignedToMe(req, res, next) {
  try {
    const tasks = await prisma.task.findMany({ where: { assignedTo: req.user.id } });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
}

async function overdue(req, res, next) {
  try {
    const where = {
      dueDate: { lt: new Date() },
      status: { not: "DONE" },
      ...(req.user.role === "ADMIN" ? {} : { assignedTo: req.user.id }),
    };
    const tasks = await prisma.task.findMany({ where });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
}

async function completed(req, res, next) {
  try {
    const where = {
      status: "DONE",
      ...(req.user.role === "ADMIN" ? {} : { assignedTo: req.user.id }),
    };
    const tasks = await prisma.task.findMany({ where });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
}

module.exports = { assignedToMe, overdue, completed };
