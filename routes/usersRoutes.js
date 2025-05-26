const express = require("express");
const router = express.Router();
const {
  register,
  login,
  forgotPassword,
  createPost,
  getPosts,
  updatePost,
  deletePost,
  deleteUser,
} = require("../controllers/usersController");
const { authenticateToken } = require("../middleware/authenticateToken");

router.post("/register", register);
router.post("/login", login);
router.post("/forgotPassword", forgotPassword);
router.post("/createPost", authenticateToken, createPost);
router.get("/posts", authenticateToken, getPosts);
router.put("/updatePost/:id", authenticateToken, updatePost);
router.delete("/deletePost/:id", authenticateToken, deletePost);
router.delete("/deleteUser/:id", authenticateToken, deleteUser);

module.exports = router;
