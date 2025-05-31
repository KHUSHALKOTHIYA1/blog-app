const bcrypt = require("bcrypt");
const db = require("../config/db");
const jwt = require("jsonwebtoken");
const sendEmail = require("../config/nodemailer");
const { body, validationResult } = require("express-validator");

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

//register
exports.register = async (req, res) => {
  //validation
  body("name").trim().notEmpty().withMessage("name is required");
  body("email").trim().notEmpty().withMessage("email is required");
  body("password")
    .isLength({ min: 6 })
    .withMessage("password atleast 6 character");

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
  };

  const generateotp = generateOTP();

  try {
    const { name, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    db.query("SELECT * FROM users WHERE email = ?", [email], (err, result) => {
      if (result.length > 0) {
        return res.status(400).json({ message: "email is't exists" });
      }

      db.query(
        "INSERT INTO users(name,email,password,otp) VALUES (?,?,?,?)",
        [name, email, hashedPassword, generateotp],
        (err) => {
          if (err) return res.status(500).json({ error: err });

          sendEmail(email, "verify your email", `your OTP is ${generateotp}`);

          res.status(200).json({ message: "email registered successfully" });
        }
      );
    });
  } catch (error) {
    return res.status(500).json({ message: "error:err" });
  }
};

// verify OTP
exports.verifyOTP = (req, res) => {
  try {
    const { email, otp } = req.body;

    db.query(
      "SELECT * FROM users WHERE email = ? AND otp = ?",
      [email, otp],
      (err, result) => {
        if (err) return res.status(500).json({ error: err });

        if (result.length === 0) {
          return res.status(400).json({ message: "Invalid OTP or Email" });
        }

        db.query(
          "UPDATE users SET is_verified = 1, otp = NULL WHERE email = ?",
          [email],
          (err) => {
            if (err) return res.status(500).json({ error: err });

            sendEmail(email, "otp verified successfully");

            res.status(200).json({ message: "Email verified successfully" });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ error: err });
  }
};

//login
exports.login = (req, res) => {
  try {
    const { email, password } = req.body;
    db.query(
      "SELECT * FROM users WHERE email = ?",
      [email],
      async (err, result) => {
        if (result.length === 0)
          return res.status(400).json({ message: "email not found" });

        const user = result[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch)
          return res.status(400).json({ message: "invalid password" });

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
          expiresIn: "100h",
        });
        res.json({ message: "login successfully", token });
      }
    );
  } catch (error) {
    return res.status(500).json({ Error: err });
  }
};

//forgotPassword
exports.forgotPassword = (req, res) => {
  try {
    const { email, password, newPassword } = req.body;

    db.query(
      "SELECT * FROM users WHERE email = ?",
      [email],
      async (req, result) => {
        if (result === 0) {
          return res.status(400).json({ message: "email dosen't exists" });
        }

        user = result[0];

        const isMatched = await bcrypt.compare(password, user.password);

        if (!isMatched)
          return res.status(400).json({ message: "password not mathod" });

        if (password === newPassword)
          return res
            .status(500)
            .json({ message: "password should be diffrent" });

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        db.query(
          "UPDATE users SET password = ? WHERE email = ?",
          [hashedPassword, email],
          (err, result) => {
            if (err) return res.status(500).json({ Error: err });
            res
              .status(200)
              .json({ message: "password forgotted successfully" });
          }
        );
      }
    );
  } catch (error) {
    return res.status(500).json({ error: err });
  }
};

// create post api
exports.createPost = (req, res) => {
  try {
    const { title, content } = req.body;

    user_id = req.user.id;

    if (!title || !content) {
      return res
        .status(400)
        .json({ message: "title and content are required" });
    }

    db.query(
      "INSERT INTO posts (title,content,user_id) VALUES (?,?,?)",
      [title, content, user_id],
      (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.status(201).json({ message: "post created successfully" });
      }
    );
  } catch (error) {
    return res.status(500).json({ error: err.message });
  }
};

// create getpost api
exports.getPosts = (req, res) => {
  try {
    db.query(
      `SELECT posts.*,users.name AS author FROM posts JOIN users ON posts.user_id = users.id ORDER BY posts.created_at DESC`,
      (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
      }
    );
  } catch (error) {
    return res.status(500).json({ error: err.message });
  }
};

//update post
exports.updatePost = (req, res) => {
  try {
    const postId = req.params.id;
    const { title, content } = req.body;
    const userId = req.user.id;

    if (!title || !content)
      return res.status(400).json({ message: "Title and content required" });

    const sql =
      "UPDATE posts SET title = ?, content = ? WHERE id = ? AND user_id = ?";
    db.query(sql, [title, content, postId, userId], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      if (result.affectedRows === 0)
        return res
          .status(403)
          .json({ message: "You can only edit your own posts" });

      res.json({ message: "Post updated successfully" });
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

//delete posts
exports.deletePost = (req, res) => {
  try {
    userId = req.user.id;
    deleteId = req.params.id;

    const sql = "DELETE FROM posts WHERE user_id = ? AND id = ?";

    db.query(sql, [userId, deleteId], (err, result) => {
      if (err) {
        return res.status(400).json({ message: "error in deleting post" });
      }
      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ message: "no matching found to be geleted" });
      }
      return res.status(200).json("post deleted successfully");
    });
  } catch (error) {
    res.status(500).json({ error: err.message });
  }
};

//delete users
exports.deleteUser = (req, res) => {
  try {
    const userId = req.user.id;
    const deleteId = req.params.id;

    if (userId != deleteId) {
      return res.status(400).json({ message: "Your ID does not match" });
    }

    db.query("DELETE FROM users WHERE id = ?", [deleteId], (err, result) => {
      if (err) {
        return res.status(400).json({ Error: err.message });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      res.status(200).json({ message: "User deleted successfully" });
    });
  } catch (error) {
    res.status(500).json({ Error: err.message });
  }
};

//get user post by id
exports.getUserById = (req, res) => {
  try {
    const userId = req.user.id;
    const userget = req.params.id;

    db.query(
      "SELECT posts.*, users.name AS author FROM posts JOIN users ON posts.user_id = users.id WHERE users.id = ?",
      [userget],
      (err, result) => {
        if (err) {
          return res
            .status(400)
            .json({ message: "Error fetching user posts", error: err.message });
        }
        if (result.length === 0) {
          return res
            .status(404)
            .json({ message: "No posts found for this user" });
        }
        res.json(result);
      }
    );
  } catch (error) {
    res.status(500).json({ error: err.message });
  }
};

//pagination
exports.pagination = (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;

    const countQuery = "SELECT COUNT(*) AS total FROM posts";

    db.query(countQuery, (countErr, countResult) => {
      if (countErr) return res.status(500).json({ error: countErr.message });

      const totalPosts = countResult[0].total;

      const postsQuery = `
        SELECT posts.*, users.name AS author
        FROM posts
        JOIN users ON posts.user_id = users.id
        ORDER BY posts.created_at DESC
        LIMIT ? OFFSET ?
      `;

      db.query(postsQuery, [limit, offset], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        res.json({
          page,
          limit,
          totalPosts,
          totalPages: Math.ceil(totalPosts / limit),
          data: results,
        });
      });
    });
  } catch (error) {
    res.status(500).json({ error: err.message });
  }
};

// comments
exports.comments = (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const query =
      "INSERT INTO comments (post_id, user_id, text) VALUES (?, ?, ?)";

    db.query(query, [postId, userId, text], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      res.status(201).json({
        message: "Comment added successfully",
        commentId: result.insertId,
      });
    });
  } catch (error) {
    return res.status(500).json({ message: "somwthing went wrong" });
  }
};

exports.getComments = (req, res) => {
  try {
    const postId = req.params.id;

    db.query(
      `SELECT comments.*,users.name AS author FROM comments JOIN users ON comments.user_id = users.id ORDER BY comments.created_at ASC`,
      [postId],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        res.json(result);
      }
    );
  } catch (error) {
    res.status(500).json({ message: "somwthing went wrong" });
  }
};

//selectByAuther
exports.selectByAuther = (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const offset = (page - 1) * limit;

  const { search, authorId } = req.query;
  const conditions = [];
  const values = [];

  if (search) {
    conditions.push("posts.title LIKE ?");
    values.push(`%${search}%`);
  }

  if (authorId) {
    conditions.push("posts.user_id = ?");
    values.push(authorId);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const countQuery = `SELECT COUNT(*) AS total FROM posts ${whereClause}`;
  const postsQuery = `
    SELECT posts.*, users.name AS author 
    FROM posts 
    JOIN users ON posts.user_id = users.id 
    ${whereClause}
    ORDER BY posts.created_at DESC 
    LIMIT ? OFFSET ?
  `;

  // Add pagination params to values
  const countValues = [...values];
  values.push(limit, offset);

  db.query(countQuery, countValues, (countErr, countResult) => {
    if (countErr) return res.status(500).json({ error: countErr.message });

    const totalPosts = countResult[0].total;

    db.query(postsQuery, values, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });

      res.json({
        page,
        limit,
        totalPosts,
        totalPages: Math.ceil(totalPosts / limit),
        data: results,
      });
    });
  });
};

exports.updateProfile = (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, avatar } = req.body;

    if (!name && !email && !avatar) {
      return res.status(400).json({ message: "No data provided to update" });
    }

    const fields = [];
    const values = [];

    if (name) {
      fields.push("name = ?");
      values.push(name);
    }

    if (email) {
      fields.push("email = ?");
      values.push(email);
    }

    if (avatar) {
      fields.push("avatar = ?");
      values.push(avatar);
    }

    values.push(userId);

    const sql = `UPDATE users SET ${fields.join(", ")} WHERE id = ? `;

    db.query(sql, values, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      res.json({ message: "profile update successfully  " });
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.toggleLike = (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    const checkQuery = "SELECT * FROM likes WHERE post_id = ? AND user_id = ?";

    db.query(checkQuery, [postId, userId], (err, result) => {
      if (err) return res.status(500).json({ error: err });

      if (result.length > 0) {
        const deleteQuery =
          "DELETE FROM likes WHERE post_id = ? AND user_id = ? ";
        db.query(deleteQuery, [postId, userId], (err) => {
          if (err) return res.status(500).json({ error: err });
          return res.json({ message: "post unliked" });
        });
      } else {
        const insertQuery = "INSERT INTO likes (post_id,user_id) VALUES(?,?)";

        db.query(insertQuery, [postId, userId], (err) => {
          if (err) return res.status(500).json({ message: "post liked" });
        });
      }
    });
  } catch (error) {
    return res.status(500).json({ error: err });
  }
};

// Allow users to view a detailed post including author and associated comments.
exports.getpostById = (req, res) => {
  const postId = req.params.id;

  const postQuery = `SELECT comments.*,users.name AS author FROM posts JOIN users ON posts.user_id = user.id WHERE posts.id = ?`;

  const commentQuery = `SELECT comments.*, users.name AS commenter FROM comments JOIN userd ON comments.user_id = user.id WHERE comments.post_id = ? ORDER BY comments.created_at ASC`;

  db.query(postQuery, [postId], (err, postResult) => {
    if (err) return res.status(500).json({ error: err.message });

    if (postResult.length === 0)
      return res.status(500).json({ error: err.message });

    db.query(commentQuery, [postId], (err, commentResult) => {
      if (err) return res.status(500).json({ error: err.message });

      res.json({
        post: postId[0],
        comments: commentResult,
      });
    });
  });
};

//List of Liked Posts by User
exports.getLikedPosts = (req, res) => {
  const userId = req.user.id;

  const sql = `
    SELECT posts.*, users.name AS author
    FROM likes
    JOIN posts ON likes.post_id = posts.id
    JOIN users ON posts.user_id = users.id
    WHERE likes.user_id = ?
  `;

  db.query(sql, [userId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    res.json({ likedPosts: result });
  });
};
