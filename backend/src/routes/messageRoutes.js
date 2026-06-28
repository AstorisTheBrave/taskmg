const express = require("express");
const { authenticate } = require("../middleware/auth");
const { list, create } = require("../controllers/messageController");

const router = express.Router();

router.use(authenticate);

router.get("/", list);
router.post("/", create);

module.exports = router;
