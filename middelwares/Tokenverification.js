import jwt from "jsonwebtoken"
import userModel from "../models/userModel.js"
// /////////////////////
const verifyAdminToken = async (req, res, next) => {
  const authToken = req.headers.authorization

  if (!authToken) {
    return res
      .status(401)
      .json({ message: "Authorization Admin token not found" })
  }

  try {
    let token = authToken.split("Bearer ")
    token = token[1]

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const user = await userModel.findById({ _id: decoded?._id })

    if (user?.role !== 1 && user?.role !== "1") {
      return res
        ?.status(403)
        ?.json({ message: "Access denied. Not an admin user" })
    }

    req.user = decoded // Store the decoded user information for future use
    next()
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Invalid authorization token", error: error })
  }
}

// const verifySubadminToken = (req, res, next) => {
//   const authToken = req.headers.authorization;

//   if (!authToken) {
//     return res.status(401).json({ message: 'Authorization token not found' });
//   }
//   console.log(authToken, "token")
//   try {
//     let token = authToken.split("Bearer ")
//     token = token[1]
//     const decoded = jwt.verify(token, "your-secret-key");
//     console.log(decoded,"docoded")

//     if (decoded._doc.type !== 'subadmin') {
//       return res.status(403).json({ message: 'Access denied. Not a subadmin user' });
//     }

//     req.user = decoded; // Store the decoded user information for future use
//     next();
//   } catch (error) {
//     return res.status(401).json({ message: 'Invalid authorization token',error:error });
//   }
// };
const verifyUserAvailable = async (req, res, next) => {
  const authToken = req.headers.authorization

  if (!authToken) {
    return res.status(401).json({ message: "Authorization token not found" })
  }

  try {
    let token = authToken.split("Bearer ")
    token = token[1]

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const user = await userModel.findById({ _id: decoded?._id })

    req.user = decoded // Store the decoded user information for future use
    next()
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Invalid authorization token", error: error })
  }
}

const verifyUserToken = async (req, res, next) => {
  const authToken = req.headers.authorization

  if (!authToken) {
    return res.status(401).json({ message: "Authorization token not found" })
  }
  // console.log(authToken, "token")
  try {
    let token = authToken.split("Bearer ")
    token = token[1]

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const user = await userModel.findById({ _id: decoded?._id })

    if (user?.role !== 2 && user?.role !== "2") {
      return res?.status(403)?.json({ message: "Access denied. Not an User" })
    }

    req.user = decoded // Store the decoded user information for future use
    next()
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Invalid authorization token", error: error })
  }
}

export { verifyAdminToken, verifyUserToken, verifyUserAvailable }
