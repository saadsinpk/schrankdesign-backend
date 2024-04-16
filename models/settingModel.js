import mongoose from "mongoose"

const settingScheme = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  value: {
    type: Number,
    required: true,
  },
  unit: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
})

export default mongoose.model("Setting", settingScheme)
