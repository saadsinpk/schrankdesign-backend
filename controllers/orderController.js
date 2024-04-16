import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import colors from "colors";

// get all order
export const getOrdersController = async (req, res) => {
  try {
    const orders = await orderModel
      .find({})
      .sort({ createdAt: -1 })
      .populate("user", "name email")
      .populate("products.product");
    return res.status(200).json({
      success: true,
      message: "All Orders",
      count: orders.length,
      orders,
    });
  } catch (err) {
    console.error(colors.bgRed.white(`${err}`));
    res.status(500).json({
      success: false,
      message: "Error in getting all products",
      err: err.message,
    });
  }
};

// get all order
export const getSingleOrderController = async (req, res) => {
  try {
    const { id } = req.params;
    const orders = await orderModel
      .findOne({ _id: id })
      .populate("user", "name email deliveryAddress billingAddress")
      .populate("products.product");
    return res.status(200).json({
      success: true,
      message: "Single Order",
      count: orders.length,
      orders,
    });
  } catch (err) {
    console.error(colors.bgRed.white(`${err}`));
    res.status(500).json({
      success: false,
      message: "Error in getting all products",
      err: err.message,
    });
  }
};

// get all order
export const getUserOrdersController = async (req, res) => {
  try {
    const orders = await orderModel
      .find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate("user", "name email")
      .populate("products.product");
    return res.status(200).json({
      success: true,
      message: "Single Order",
      count: orders.length,
      orders,
    });
  } catch (err) {
    console.error(colors.bgRed.white(`${err}`));
    res.status(500).json({
      success: false,
      message: "Error in getting all products",
      err: err.message,
    });
  }
};

// get all order
export const getSingleUserOrderController = async (req, res) => {
  try {
    const { id } = req.params;
    const orders = await orderModel
      .findOne({ _id: id, user: req.user._id })
      .populate("user", "name email")
      .populate("products.product");
    return res.status(200).json({
      success: true,
      message: "Single Order",
      count: orders.length,
      orders,
    });
  } catch (err) {
    console.error(colors.bgRed.white(`${err}`));
    res.status(500).json({
      success: false,
      message: "Error in getting all products",
      err: err.message,
    });
  }
};
