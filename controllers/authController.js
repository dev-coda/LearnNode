const passport = require("passport");
const crypto = require("crypto");
const mongoose = require("mongoose");
const User = mongoose.model("User");
const promisify = require("es6-promisify");
const mail = require("../handlers/mail");

exports.login = passport.authenticate("local", {
  failureRedirect: "login",
  failureFlash: "Failed to login",
  successRedirect: "/",
  successFlash: "You are now logged in",
});

exports.logout = async (req, res) => {
  await req.logout();
  req.flash("success", "You are now logged out");
  res.redirect("/");
};

exports.isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
    return;
  } else {
    req.flash("error", "You must be logged in");
    res.redirect("/login");
  }
};

exports.forgot = async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    req.flash("error", "User not found");
    res.redirect("/register");
  } else {
    user.resetPasswordToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();
  }
  const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
  await mail.send({
    user: user,
    subject: "Password reset",
    resetURL,
    filename: "password-reset",
  });
  req.flash("success", `You have been emailed a password reset link.`);
  res.redirect("/login");
};

exports.reset = async (req, res, next) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    req.flash("error", "Invalid password reset link");
    res.redirect("/login");
  } else {
    res.render("reset", { title: "Reset Password" });
  }
};

exports.confirmedPasswords = async (req, res, next) => {
  if (req.body.password === req.body["password-confirm"]) {
    next();
  } else {
    req.flash("error", "Passwords do not match");
    res.redirect("back");
  }
};

exports.update = async (req, res, next) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() },
  });
  if (!user) {
    req.flash("error", "Invalid password reset link");
    res.redirect("/login");
  } else {
    const setPassword = promisify(user.setPassword, user);
    await setPassword(req.body.password);
    user.resetPasswordExpires = undefined;
    user.resetPasswordToken = undefined;
    const updatedUser = await user.save();
    await req.login(updatedUser);
    req.flash("success", "Password updated successfully");
    res.redirect("/");
  }
};
