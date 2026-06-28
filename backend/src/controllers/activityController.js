const prisma = require("../db");

async function list(req, res, next) {
  try {
    const logs = await prisma.activityLog.findMany({ orderBy: { createdAt: "desc" } });
    res.json(logs);
  } catch (err) {
    next(err);
  }
}

module.exports = { list };
