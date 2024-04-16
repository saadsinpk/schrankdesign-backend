import { comparePassword, hashPassword } from "../helpers/authHelper.js";
import userModel from "../models/userModel.js";
import colors from "colors";
import JWT from "jsonwebtoken";
import fs from "fs";

// register
export const registerController = async (req, res) => {
  try {
    const { name, email, password, answer } = req.fields;
    const { photo } = req.files;

    //validation
    const missingFields = {};
    if (!name) missingFields.name = "Name is required";
    if (!email) missingFields.email = "Email is required";
    if (!password) missingFields.password = "Password is required";
    if (!answer) missingFields.address = "Answer is required";
    if (!photo) missingFields.photo = "Image is required";

    if (Object.keys(missingFields).length > 0) {
      return res.status(400).json({ error: missingFields });
    }

    if (photo && photo.size > 1000000) {
      return res
        .status(500)
        .send({ error: "Photo is required and should be less then 1 mb" });
    }

    //existing user
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(401).send({
        success: true,
        message: "Already Registered",
      });
    }

    //register user
    const hashedPassword = await hashPassword(password);

    //save
    const user = new userModel({
      name,
      email,
      password: hashedPassword,
      answer,
    });

    if (photo) {
      user.photo.data = fs.readFileSync(photo.path);
      user.photo.contentType = photo.type;
    }
    await user.save();

    return res.status(200).send({
      success: true,
      message: "Registered Successfully",
      user,
    });
  } catch (err) {
    console.log(colors.bgRed.white(`${err}`));
    res.status(500).send({
      success: false,
      message: "Error in register",
      err,
    });
  }
};

//login controller
export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check if the user exists
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Email is not registered",
      });
    }

    // Compare the password
    const match = await comparePassword(password, user.password);
    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    // Generate and sign a JWT token
    const token = await JWT.sign({ _id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    // Send a successful response
    res.status(200).json({
      success: true,
      message: "Login Successfully",
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        answer: user.answer,
        image: user?.photo,
        token,
      },
    });
  } catch (err) {
    console.error(colors.bgRed.white(`${err}`));
    res.status(500).json({
      success: false,
      message: "Error in login",
      error: err.message,
    });
  }
};

// forgot password
export const forgotPasswordController = async (req, res) => {
  try {
    const { email, answer, newPassword } = req.body;

    //validation
    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }
    if (!answer) {
      return res.status(400).json({
        message: "Answer is required",
      });
    }
    if (!newPassword) {
      return res.status(400).json({
        message: "New Password is required",
      });
    }

    //check user
    const user = await userModel.findOne({ email });

    //validation
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Wrong email or password",
      });
    }
    // Additional Validation: Check if the answer matches
    if (answer !== user.answer) {
      return res.status(400).json({
        success: false,
        message: "Answer does not match",
      });
    }

    const hashedPassword = await hashPassword(newPassword);

    await userModel.findByIdAndUpdate(user._id, { password: hashedPassword });
    res.status(200).json({
      success: true,
      message: "Successfully reset the password.",
    });
  } catch (err) {
    console.error(colors.bgRed.white(`${err}`));
    res.status(500).json({
      success: false,
      message: "Error in forgot password",
      err,
    });
  }
};

// profile update
export const profileUpdateController = async (req, res) => {
  try {
    const { name, password, answer } = req.fields;

    const { photo } = req.files;

    const user = await userModel.findById(req.user._id);
    console.log(user);

    if (photo && photo.size > 1000000) {
      return res
        .status(500)
        .send({ error: "Photo is required and should be less then 1 mb" });
    }

    if (photo) {
      photo.data = fs.readFileSync(photo.path);
      photo.contentType = photo.type;
    }
    const hashedPassword = password ? await hashPassword(password) : undefined;
    const updateUser = await userModel.findByIdAndUpdate(
      req.user._id,
      {
        name: name || user.name,
        answer: answer || user.answer,
        password: hashedPassword || user.password,
        photo: photo || user.photo,
      },
      { new: true }
    );

    return res.status(200).send({
      success: true,
      message: "Successfully Updated the profile",
      updateUser: {
        name: updateUser?.name,
        email: updateUser?.email,
        answer: updateUser?.answer,
        image: updateUser?.photo,
      },
    });
  } catch (err) {
    console.error(colors.bgRed.white(`${err}`));
    res.status(500).json({
      success: false,
      message: "Error in profile update.",
      err,
    });
  }
};

// profile update
export const AdminProfileUpdateController = async (req, res) => {
  try {
    const { name, password, answer, email } = req.fields;

    const { photo } = req.files;
    const { id } = req.params;

    const user = await userModel.findById(id);
    console.log(user);

    if (photo && photo.size > 1000000) {
      return res
        .status(500)
        .send({ error: "Photo is required and should be less then 1 mb" });
    }

    if (photo) {
      photo.data = fs.readFileSync(photo.path);
      photo.contentType = photo.type;
    }

    const hashedPassword = password ? await hashPassword(password) : undefined;
    const updateUser = await userModel.findByIdAndUpdate(
      id,
      {
        name: name || user.name,
        email: email || user?.email,
        answer: answer || user.answer,
        password: hashedPassword || user.password,
        photo: photo || user.photo,
      },
      { new: true }
    );

    return res.status(200).send({
      success: true,
      message: "Successfully Updated the user profile.",
      updateUser: {
        name: updateUser?.name,
        email: updateUser?.email,
        answer: updateUser?.answer,
        image: updateUser?.photo,
      },
    });
  } catch (err) {
    console.error(colors.bgRed.white(`${err}`));
    res.status(500).json({
      success: false,
      message: "Error in profile update.",
      err,
    });
  }
};

//Single User
export const singleUserController = async (req, res) => {
  try {
    const user = await userModel.findById(req.user._id);
    console.log(user);
    if (!user) {
      return res.status(400).send({
        success: false,
        message: "User not found",
      });
    }
    return res.status(200).send({
      success: true,
      message: "User found.",
      user: {
        name: user?.name,
        email: user?.email,
        answer: user?.answer,
        image: user?.photo,
      },
    });
  } catch (err) {
    console.error(colors.bgRed.white(`${err}`));
    res.status(500).json({
      success: false,
      message: "Error in Single user.",
      err,
    });
  }
};
//Admin Single User
export const adminSingleUserController = async (req, res) => {
  try {
    const { id } = req.params;

    //check for admin
    const admin = await userModel.findById(req.user._id);

    if (admin?.role !== 1) {
      return res.status(400).send({
        success: false,
        message: "Unauthorized access.",
      });
    }

    const user = await userModel.findById(id);
    console.log(user);
    if (!user) {
      return res.status(400).send({
        success: false,
        message: "User not found",
      });
    }
    return res.status(200).send({
      success: true,
      message: "User found for Admin.",
      user,
    });
  } catch (err) {
    console.error(colors.bgRed.white(`${err}`));
    res.status(500).json({
      success: false,
      message: "Error in Single user.",
      err,
    });
  }
};

//All Users
export const allUsersController = async (req, res) => {
  try {
    const users = await userModel.find({ role: "0" }).populate("photo");

    if (!users) {
      return res.status(400).send({
        success: false,
        message: "No Users found.",
      });
    }

    const formattedUsers = users.map((user) => ({
      _id: user?._id,
      name: user?.name,
      email: user?.email,
      image: user?.photo,
    }));

    return res.status(200).send({
      success: true,
      message: "Users found.",
      users: formattedUsers,
    });
  } catch (err) {
    console.error(colors.bgRed.white(`${err}`));
    res.status(500).json({
      success: false,
      message: "Error in Single user.",
      err,
    });
  }
};

//Delete User
export const deleteUsersController = async (req, res) => {
  try {
    const { id } = req.params;

    //check for admin
    const admin = await userModel.findById(req.user._id);

    if (admin?.role !== 1) {
      return res.status(400).send({
        success: false,
        message: "Unauthorized access.",
      });
    }

    //find user
    const user = await userModel.findOne({ _id: id });

    if (!user) {
      return res.status(400).send({
        success: false,
        message: "No User found.",
      });
    }

    await userModel.findByIdAndDelete({ _id: id });

    return res.status(200).send({
      success: true,
      message: "User Deleted Successfully.",
    });
  } catch (err) {
    console.error(colors.bgRed.white(`${err}`));
    res.status(500).json({
      success: false,
      message: "Error in Single user.",
      err,
    });
  }
};

//test controller
export const testController = async (req, res) => {
  res.send("Protected Route");
};
