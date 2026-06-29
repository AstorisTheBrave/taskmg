const prisma = require("../db");

const MAX_ROWS = 1000;

async function logActivity({ taskId = null, userId = null, action, metadata = null }) {
  const entry = await prisma.activityLog.create({
    data: { taskId, userId, action, metadata },
  });

  await prisma.$executeRaw`
    DELETE FROM activity_logs
    WHERE id NOT IN (
      SELECT id FROM activity_logs ORDER BY created_at DESC LIMIT ${MAX_ROWS}
    )
  `;

  return entry;
}

module.exports = { logActivity };
