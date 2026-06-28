const express = require("express");
const { authenticate } = require("../middleware/auth");
const {
  list,
  getById,
  create,
  update,
  remove,
  assign,
  setStatus,
} = require("../controllers/taskController");
const commentRoutes = require("./commentRoutes");

const router = express.Router();

router.use(authenticate);

router.get("/", list);
router.get("/:id", getById);
router.post("/", create);
router.patch("/:id", update);
router.delete("/:id", remove);
router.patch("/:id/assign", assign);
router.patch("/:id/status", setStatus);
router.use("/:id/comments", commentRoutes);

module.exports = router;
