const express = require("express");
const router = express.Router();
const {
  register,
  login,
  forgotPassword,
  createPost,
  getPosts,
} = require("../controllers/usersController");
const { authenticateToken } = require("../middleware/authenticateToken");

router.post("/register", register);
router.post("/login", login);
router.post("/forgotPassword", forgotPassword);
router.post("/createPost", authenticateToken, createPost);
router.get("/posts", authenticateToken, getPosts);

module.exports = router;
