const prisma = require("../db");

function logActivity({ taskId = null, userId = null, action, metadata = null }) {
  return prisma.activityLog.create({
    data: { taskId, userId, action, metadata },
  });
}

module.exports = { logActivity };
