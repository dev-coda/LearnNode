const mongoose = require("mongoose");
mongoose.Promise = global.Promise;
const slug = require("slugs");

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: "Please enter a store name!",
  },
  slug: String,
  description: {
    type: String,
    trim: true,
  },
  tags: [String],
  created: {
    type: Date,
    default: Date.now,
  },
  location: {
    type: { type: String, default: "Point" },
    coordinates: [
      {
        type: Number,
        required: "You must supply coordinates",
      },
    ],
    address: { type: String, required: "You must supply an address" },
  },
  photo: String,
  author: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: "You must provide an author",
  },
});

storeSchema.index({ name: "text", description: "text" });

storeSchema.pre("save", async function (next) {
  if (!this.isModified("name")) {
    next(); // skip it
    return; // stop this function from running
  }

  this.slug = slug(this.name);
  const slugRegExp = new RegExp(`^${this.slug}((-[0-9]*)?)$`, "i");
  const store = await this.constructor.find({ slug: slugRegExp });
  if (store.length) {
    this.slug = `${this.slug}-${store.length + 1}`;
  }
  next();
});

storeSchema.statics.getTagsList = function () {
  return this.aggregate([
    { $unwind: "$tags" },
    { $group: { _id: "$tags", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
};

module.exports = mongoose.model("Store", storeSchema);
