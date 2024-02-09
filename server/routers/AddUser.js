const express = require("express");
const User = require("../models/User");
const router = express.Router();
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");
const jwtSecret = "HaHa";
const app = express();

app.use(cors());

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "images");
  },
  filename: function (req, file, cb) {
    cb(null, uuidv4() + "-" + Date.now() + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedFileTypes = ["image/jpeg", "image/jpg", "image/png"];
  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

let upload = multer({ storage, fileFilter });
app.use(express.urlencoded({ extended: true }));
// Serve uploaded photos
app.use("/uploads", express.static("uploads"));

router.route("/createUser").post(upload.single("photo"), async (req, res) => {
  const name = req.body.name;
  const phone = req.body.phone;
  const role = req.body.role;
  const regnumber = req.body.regnumber;
  const email = req.body.email;
  const photo = req.file.filename;
  const Ppassword = req.body.password;
  const saltRounds = 10;

  try {
    // Check if user with the same registration number already exists
    const existingUser = await User.findOne({ regnumber: regnumber });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with this registration number already exists" });
    }

    const password = await bcrypt.hash(Ppassword, saltRounds);
    const newUserData = {
      name,
      phone,
      role,
      regnumber,
      password,
      email,
      photo,
    };

    const newUser = new User(newUserData);

    await newUser.save();
    res.json("Mentor Added");
  } catch (error) {
    console.error(error);
    res.status(400).json("Error: " + error.message);
  }
});

// changePassword
router.route("/changePassword").post(async (req, res) => {
  const oldPassword = req.body.oldPassword;
  const newPassword = req.body.newPassword;
  const userId = req.body.userId;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Compare the old password provided by the user with the hashed password stored in the database
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user's password with the new hashed password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/mentorList", async (req, res) => {
  try {
    const users = await User.find();

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/getMentorByUserId", async (req, res) => {
  // Extract the user ID from the request query parameters
  const mentor_id = req.query.mentorId;

  try {
    // Query the database to retrieve the user based on the ID
    const mentor = await User.findById(mentor_id);

    if (!mentor) {
      return res.status(404).json({ error: "Mentor not found" });
    }

    res.json(mentor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
