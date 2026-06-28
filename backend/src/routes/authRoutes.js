const express = require("express");
const { signup, login, forgotPassword, resetPassword } = require("../controllers/authController");
const { loginLimiter, signupLimiter, forgotPasswordLimiter } = require("../middleware/rateLimit");

const router = express.Router();

router.post("/signup", signupLimiter, signup);
router.post("/login", loginLimiter, login);
router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);
router.post("/reset-password", forgotPasswordLimiter, resetPassword);

module.exports = router;
