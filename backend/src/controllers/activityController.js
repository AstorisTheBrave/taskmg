const prisma = require("../db");

async function list(req, res, next) {
  try {
    const logs = await prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        user: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
      },
    });
    res.json(logs);
  } catch (err) {
    next(err);
  }
}

module.exports = { list };
