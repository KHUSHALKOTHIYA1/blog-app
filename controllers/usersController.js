const bcrypt = require("bcrypt");
const db = require("../config/db");
const jwt = require("jsonwebtoken");

//register
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    db.query("SELECT * FROM users WHERE email = ?", [email], (err, result) => {
      if (result.length > 0) {
        return res.status(400).json({ message: "email is't exists" });
      }

      db.query(
        "INSERT INTO users(name,email,password) VALUES (?,?,?)",
        [name, email, hashedPassword],
        (err) => {
          if (err) return res.status(500).json({ error: err });
          res.status(200).json({ message: "email registered successfully" });
        }
      );
    });
  } catch (error) {
    return res.status(500).json({ message: "error:err" });
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
          expiresIn: "1h",
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
  const { title, content } = req.body;

  user_id = req.user.id;

  if (!title || !content) {
    return res.status(400).json({ message: "title and content are required" });
  }

  db.query(
    "INSERT INTO posts (title,content,user_id) VALUES (?,?,?)",
    [title, content, user_id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.status(201).json({ message: "post created successfully" });
    }
  );
};

// create getpost api
exports.getPosts = (req, res) => {
  db.query(
    `SELECT posts.*,users.name AS author FROM posts JOIN users ON posts.user_id = users.id ORDER BY posts.created_at DESC`,
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
};
