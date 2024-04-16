import JWT from "jsonwebtoken";
import colors from "colors";
import userModel from "../models/userModel.js";

// Protected routes token base
export const requireSignIn = (req, res, next) => {
  try {
    const decode = JWT.verify(
      req.headers.authorization,
      process.env.JWT_SECRET
    );
    req.user = decode;
    next();
  } catch (err) {
    console.log(colors.bgRed.white(`${err}`));
    res.status(500).send({
      success: false,
      message: "Authentication Failed",
      err,
    });
  }
};

// admin access
export const isAdmin = async (req, res, next) => {
  try {
    const user = await userModel.findById(req?.user?._id);
    if (user?.role !== 1) {
      return res.status(401).send({
        success: false,
        message: "UnAuthorized Access",
      });
    } else {
      next();
    }
  } catch (err) {
    console.log(colors.bgRed.white(`${err}`));
    res.status(401).send({
      success: false,
      message: "Error in Admin Middelware",
      err,
    });
  }
};

// user access
export const isUser = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.user._id);
    if (user.role === 1) {
      return res.status(401).send({
        success: false,
        message: "UnAuthorized Access",
      });
    } else {
      next();
    }
  } catch (err) {
    console.log(colors.bgRed.white(`${err}`));
    res.status(401).send({
      success: false,
      message: "Error in User Middelware",
      err,
    });
  }
};
