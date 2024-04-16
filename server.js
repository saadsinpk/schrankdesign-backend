import express from "express"
import colors from "colors"
import dotenv from "dotenv"
import morgan from "morgan"
import cors from "cors"
import connectDb from "./config/db.js"
import authRoutes from "./routes/authRoutes.js"
import categoryRoutes from "./routes/categoryRoutes.js"
import productRoutes from "./routes/productRoutes.js"
import orderRoutes from "./routes/orderRoutes.js"
import payPalPaymentRoutes from "./routes/payPalPaymentRoutes.js"
import Klarna from "./routes/KlarnaRoutes.js"
import plates from "./routes/platesRoutes.js"
import platestype from "./routes/platesTypesRoutes.js"
import edges from "./routes/edgeRoutes.js"
import drawers from "./routes/Assests/DrawersRoutes.js"
import doors from "./routes/Assests/DoorsRoutes.js"
import handles from "./routes/Assests/HandleRoutes.js"
import feet from "./routes/Assests/FeetRoutes.js"
import others from "./routes/Assests/othersRoutes.js"
import fittings from "./routes/Assests/FittingRoutes.js"
import partlistRouter from "./routes/PartListRouter.js"
import testpartlistRouter from "./routes/testPartListRouter.js"
import CalculationRouter from "./routes/Calculation.js"
import variableRoutes from "./routes/MaterialvariableRoutes.js"
import GeneralvariableRoutes from "./routes/GeneralvariableRoutes.js"
import WorkingCalculationRoutes from "./routes/WorkingvariableRoutes.js"
import feesCalculationRoutes from "./routes/FeesvariableRoutes.js"
import calcInfoRouter from "./routes/CalcInfoRoutes.js"
import settingsRounter from "./routes/SettingRoutes.js"

//env config
dotenv.config()

//mongo db connection
connectDb()

// rest object
const app = express()

// CORS Configuration
// const corsOptions = {
//   origin: ["", "http://localhost:3003"],
//   optionsSuccessStatus: 200, // Some legacy browsers (e.g., IE11) may require this
// };

//middelwares
app.use("/uploads/", express.static("uploads"))
app.use(cors("*"))
app.use(express.json())
app.use(morgan("dev"))
//auth routes
app.use("/api/v1/user", authRoutes)
app.use("/api/v1/category", categoryRoutes)
app.use("/api/v1/product", productRoutes)
app.use("/api/v1/order", orderRoutes)
app.use("/api/v1/payment", payPalPaymentRoutes)
app.use("/api/v1/payment", Klarna)
app.use("/api/v1/plates", plates)
app.use("/api/v1/platestypes", platestype)
app.use("/api/v1/edges", edges)
app.use("/api/v1/assests", drawers, doors, handles, feet, others, fittings)
app.use("/api/v1/PartList", partlistRouter)
app.use("/api/v1/TestpartList", testpartlistRouter)
app.use("/api/v1/calculation", CalculationRouter)
app.use(
  "/api/v1/variables",
  variableRoutes,
  GeneralvariableRoutes,
  WorkingCalculationRoutes,
  feesCalculationRoutes
)
app.use("/api/v1/calcInfo", calcInfoRouter)
app.use("/api/v1/settings", settingsRounter)

const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env

//rest api
app.get("/", (req, res) => {
  res.send({ message: " Welcome to node js - Schrankdesign" })
})

// PORT
const PORT = process.env.PORT || 8080

// Listen
app.listen(PORT, () => {
  console.log(
    // colors.bgCyan.white(
    `Server running on ${process.env.DEV_MODE} mode on port ${PORT}`
    // )
  )
  // console.log("Client id is ", PAYPAL_CLIENT_ID)
  // console.log("Secret  id is ", PAYPAL_CLIENT_SECRET)
})
