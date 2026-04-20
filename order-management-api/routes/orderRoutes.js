const express = require("express");
const router = express.Router();
const Order = require("../models/Order");

// Hàm validate totalAmount
const validateTotalAmount = (items, totalAmount) => {
  if (!items || items.length === 0) {
    return { valid: false, message: "Items không được trống" };
  }

  const calculatedTotal = items.reduce((sum, item) => {
    return sum + item.quantity * item.unitPrice;
  }, 0);

  if (Math.abs(calculatedTotal - totalAmount) > 0.01) {
    return {
      valid: false,
      message: `totalAmount sai! Dự tính: ${calculatedTotal}, nhưng bạn gửi: ${totalAmount}`,
    };
  }

  return { valid: true };
};

// 1. Lay toan bo don hang, loc theo status, va sort theo totalAmount (GET /api/orders?status=pending&sort=asc)
router.get("/", async (req, res) => {
  try {
    const { status, sort } = req.query;
    let query = {};
    let sortObj = { totalAmount: -1 }; // Mac dinh sap xep theo totalAmount giam dan

    // Neu co status trong query, thi loc theo status
    if (status) {
      query = { status: status };
    }

    // Neu co sort trong query, thi sap xep theo totalAmount
    if (sort) {
      // Format: "asc" hoac "desc"
      const sortOrder = sort === "asc" ? 1 : -1; // 1 = tang dan, -1 = giam dan
      sortObj = { totalAmount: sortOrder };
    }

    const orders = await Order.find(query).sort(sortObj);

    res.json({
      success: true,
      data: orders,
      message: status
        ? `Lấy đơn hàng với trạng thái '${status}' thành công`
        : "Lấy danh sách đơn hàng thành công",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      data: null,
      message: err.message,
    });
  }
});

// 2. Tim kiem don hang theo ten khach hang (GET /api/orders/search?name=Khoa)
router.get("/search", async (req, res) => {
  try {
    const { name } = req.query;

    // Kiem tra xem co parameter name khong
    if (!name) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "Vui lòng cung cấp tham số 'name' để tìm kiếm",
      });
    }

    // Su dung Regex de tim kiem khong phan biet hoa/thuong
    const orders = await Order.find({
      customerName: { $regex: name, $options: "i" },
    }).sort({ totalAmount: -1 });

    res.json({
      success: true,
      data: orders,
      message: `Tìm thấy ${orders.length} đơn hàng với tên khách hàng chứa '${name}'`,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      data: null,
      message: err.message,
    });
  }
});

// 3. Lay don hang theo ID
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Không tìm thấy đơn hàng",
      });
    }
    res.json({
      success: true,
      data: order,
      message: "Lấy đơn hàng thành công",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: error.message,
    });
  }
});

// 3. Tao don hang moi (POST /api/orders)
router.post("/", async (req, res) => {
  // Validate totalAmount
  const validation = validateTotalAmount(req.body.items, req.body.totalAmount);
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      data: null,
      message: validation.message,
    });
  }

  const order = new Order({
    customerName: req.body.customerName,
    customerEmail: req.body.customerEmail,
    items: req.body.items,
    totalAmount: req.body.totalAmount,
  });

  try {
    const newOrder = await order.save();
    res.status(201).json({
      success: true,
      data: newOrder,
      message: "Tạo đơn hàng thành công",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      data: null,
      message: error.message,
    });
  }
});

// 4. Cap nhat don hang (PUT /api/orders/:id)
router.put("/:id", async (req, res) => {
  // Validate totalAmount nếu items hoặc totalAmount được update
  if (req.body.items || req.body.totalAmount) {
    const items = req.body.items;
    const totalAmount = req.body.totalAmount;

    if (items && totalAmount) {
      const validation = validateTotalAmount(items, totalAmount);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          data: null,
          message: validation.message,
        });
      }
    }
  }

  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );
    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Không tìm thấy đơn hàng",
      });
    }
    res.json({
      success: true,
      data: updatedOrder,
      message: "Cập nhật đơn hàng thành công",
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      data: null,
      message: err.message,
    });
  }
});

// 5. Xoa don hang (DELETE /api/orders/:id)
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Order.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Không tìm thấy đơn hàng",
      });
    }
    res.json({
      success: true,
      data: deleted,
      message: "Xóa đơn hàng thành công!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      data: null,
      message: err.message,
    });
  }
});

module.exports = router;
