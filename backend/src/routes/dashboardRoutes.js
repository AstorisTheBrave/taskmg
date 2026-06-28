const express = require("express");
const { authenticate } = require("../middleware/auth");
const { assignedToMe, overdue, completed } = require("../controllers/dashboardController");

const router = express.Router();

router.use(authenticate);

router.get("/assigned-to-me", assignedToMe);
router.get("/overdue", overdue);
router.get("/completed", completed);

module.exports = router;
