const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, default: "otros" },
  image: { type: String },
}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);
