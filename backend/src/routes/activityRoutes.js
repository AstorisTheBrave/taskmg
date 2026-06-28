const express = require("express");
const { authenticate, requireRole } = require("../middleware/auth");
const { list } = require("../controllers/activityController");

const router = express.Router();

router.get("/", authenticate, requireRole("ADMIN"), list);

module.exports = router;
