const express = require("express");
const { list, create } = require("../controllers/commentController");

const router = express.Router({ mergeParams: true });

router.get("/", list);
router.post("/", create);

module.exports = router;
