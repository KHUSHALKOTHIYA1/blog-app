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
  getUserById,
  pagination,
  comments,
  getComments,
  selectByAuther,
  verifyOTP,
} = require("../controllers/usersController");
const { authenticateToken } = require("../middleware/authenticateToken");

router.post("/register", register);
router.post("/login", login);
router.post("/verifyOTP", verifyOTP);
router.post("/forgotPassword", forgotPassword);
router.post("/createPost", authenticateToken, createPost);
router.get("/posts", authenticateToken, getPosts);
router.put("/updatePost/:id", authenticateToken, updatePost);
router.delete("/deletePost/:id", authenticateToken, deletePost);
router.delete("/deleteUser/:id", authenticateToken, deleteUser);
router.get("/getUserById/:id", authenticateToken, getUserById);
router.get("/pagination", authenticateToken, pagination);
router.post("/comments/:id", authenticateToken, comments);
router.get("/getComments/:id", authenticateToken, getComments);
router.get("/selectByAuther", authenticateToken, selectByAuther);


module.exports = router;
