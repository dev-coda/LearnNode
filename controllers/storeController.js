const mongoose = require("mongoose");
const Store = mongoose.model("Store");
const multer = require("multer");
const jimp = require("jimp");
const uuid = require("uuid");
const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter(req, file, next) {
    const isPhoto = file.mimetype.startsWith("image/");
    if (isPhoto) {
      next(null, true);
    } else {
      next({ message: "That filetype is not allowed" }, false);
    }
  },
};

exports.upload = multer(multerOptions).single("photo");
exports.resize = async (req, res, next) => {
  if (!req.file) {
    next();
    return;
  } else {
    const fileExtension = req.file.mimetype.split("/")[1];
    req.body.photo = `${uuid.v4()}.${fileExtension}`;
    const photo = await jimp.read(req.file.buffer);
    await photo.resize(800, jimp.AUTO);
    await photo.write(`./public/uploads/${req.body.photo}`);
    next();
  }
};
exports.getStoreBySlug = async (req, res, next) => {
  const store = await Store.findOne({ slug: req.params.slug });
  if (!store) {
    next();
  }
  res.render("store", { title: store.name, store: store });
};
exports.homePage = (req, res) => {
  res.render("index");
};

exports.addStore = (req, res) => {
  res.render("editStore", { title: "Add Store" });
};

exports.createStore = async (req, res) => {
  const store = await new Store(req.body).save();
  req.flash(
    "success",
    `Successfully added store ${store.name}. Leave a review!`
  );
  res.redirect(`/store/${store.slug}`);
};

exports.editStore = async (req, res) => {
  const store = await Store.findById(req.params.storeId);
  res.render("editStore", { title: `Edit ${store.name}`, store: store });
};

exports.updateStore = async (req, res) => {
  if (req.body.location) req.body.location.type = "Point";
  const store = await Store.findByIdAndUpdate(req.params.id, req.body, {
    new: true, // Return the updated store instead of the original
    runValidators: true,
  }).exec();
  req.flash(
    "success",
    `<strong>Updated store ${store.name}. </strong> <a href="/stores/${store.slug}"> View ${store.name}</a>`
  );
  res.redirect(`/stores/${store.id}/edit`);
};
exports.getStores = async (req, res) => {
  //Query Database for store list
  const stores = await Store.find();
  res.render("stores", { title: "Stores", stores: stores });
};
