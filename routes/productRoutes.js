const express = require("express");
const Product = require("../models/Product");
const { body, validationResult } = require("express-validator");
const auth = require("../middleware/authMiddleware");   // ✅ add this

const router = express.Router();

// ADD PRODUCT ROUTE (Protected)
router.post("/",
auth,    // ✅ protect this route
[
  body("name").notEmpty(),
  body("category").notEmpty(),
  body("price").isNumeric()
],
async (req, res) => {

  const errors = validationResult(req);
  if(!errors.isEmpty())
    return res.status(400).json(errors);

  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }

});

// SEARCH + PAGINATION ROUTE
router.get("/", async (req, res) => {

  const { search, page = 1, limit = 5 } = req.query;
  const query = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { category: { $regex: search, $options: "i" } }
    ];
  }

  try {
    const products = await Product.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Product.countDocuments(query);

    res.json({
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      products
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }

});

// AGGREGATION ROUTE
router.get("/stats", async (req, res) => {

  try {
    const result = await Product.aggregate([
      {
        $group: {
          _id: "$category",
          totalProducts: { $sum: 1 },
          avgPrice: { $avg: "$price" }
        }
      },
      {
        $sort: { avgPrice: -1 }
      }
    ]);

    res.json(result);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }

});

module.exports = router;   // ✅ must be at bottom