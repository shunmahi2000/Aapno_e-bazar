const User = require("../models/user");
const jwt = require("jsonwebtoken"); //to generate signed token
const expressJwt = require("express-jwt"); //for authorization check
const { errorHandler } = require("../helpers/dbErrorHandlers");
const { response } = require("express");
exports.signup = async (req, res) => {
  const user = new User(req.body);
  try {
    await user.save();
    user.salt = undefined;
    user.hashed_password = undefined;
    res.json({ user });
  } catch (err) {
    return res.status(400).json({
      error: errorHandler(err),
    });
  }
};

exports.signin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        err: "User with that email does not exist. Please sign up",
      });
    }
    if (!user.authenticate(password)) {
      return res.status(401).json({
        error: "Email and Password do not match",
      });
    }
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
    res.cookie("t", token, { expire: new Date() + 9999 });
    const { _id, name, role } = user;
    return res.json({ token, user: { _id, email, name, role } });
  } catch (err) {
    return res.status(500).json({
      error: "Internal server error",
    });
  }
};
exports.signout = (req, res) => {
  res.clearCookie("t");
  res.json({ message: "Signout successful" });
};

exports.requireSignin = expressJwt({
  secret: process.env.JWT_SECRET,
  algorithms: ["HS256"], // added later
  userProperty: "auth",
});

exports.isAuth = (req, res, next) => {
  let user = req.profile && req.auth && req.profile._id == req.auth._id;
  if (!user) {
    return res.status(403).json({
      error: "Access Denied",
    });
  }
  next();
};
exports.isAdmin = (req, res, next) => {
  if (req.profile.role === 0) {
    return res.status(403).json({
      error: "Admin resource1 Access denied",
    });
  }
  next();
};
