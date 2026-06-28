const express = require("express");
const { authenticate, requireRole } = require("../middleware/auth");
const { list, create, update, remove } = require("../controllers/userController");

const router = express.Router();

router.use(authenticate, requireRole("ADMIN"));

router.get("/", list);
router.post("/", create);
router.patch("/:id", update);
router.delete("/:id", remove);

module.exports = router;
