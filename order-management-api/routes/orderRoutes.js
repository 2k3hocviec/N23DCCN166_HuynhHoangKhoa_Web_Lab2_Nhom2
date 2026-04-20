const express = require("express");
const router = express.Router();
const Order = require("../models/Order");

// 1. Lay toan bo don hang (GET /api/orders)
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order)
      return res.status(404).json({ message: "Khong tim thay don hang" });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/", async (req, res) => {
  const order = new Order({
    customerName: req.body.customerName,
    customerEmail: req.body.customerEmail,
    items: req.body.items,
    totalAmount: req.body.totalAmount,
  });

  try {
    const newOrder = await order.save();
    res.status(201).json(newOrder);
  } catch (error) {
    res.status(400).json({ message: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );
    if (!updatedOrder)
      return res.status(404).json({ message: "Khong tim thay don hang" });
    res.json(updatedOrder);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Order.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Khong tim thay don hang" });
    res.json({ message: "Da xoa don hang thanh cong!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
module.exports = router;
