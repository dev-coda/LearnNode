const mongoose = require("mongoose");
const Store = mongoose.model("Store");

exports.loginForm = (req, res) => {
  res.render("login", { title: "Login Form" });
};

exports.registerForm = (req, res) => {
  res.render("register", { title: "Register" });
};

exports.validateRegister = (req, res, next) => {
  req.sanitizeBody("name");
  req.checkBody("name", "You must provide a name").notEmpty();
  req.checkBody("email", "Email not valid").notEmpty().isEmail();
  req.sanitizeBody("email").normalizeEmail({
    remove_dots: false,
    remove_extension: false,
    gmail_remove_subadress: false,
  });
  req.sanitizeBody("password");
  req.checkBody("password", "Password not valid").notEmpty();
  req.checkBody("confirm-password", "Password not valid").notEmpty();

  req
    .checkBody("confirm-password", "Passwords do not match")
    .equals(req.body.password);

  const errors = req.validationErrors();
  if (errors) {
    req.flash(
      "error",
      errors.map((err) => err.msg)
    );
    res.render("register", {
      title: "Register",
      body: req.body,
      flashes: req.flash(),
    });
    return;
  }
};
