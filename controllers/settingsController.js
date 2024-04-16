import settingModel from "../models/settingModel.js"

export const getAllSettingsController = async (req, res) => {
  try {
    const settingInfo = await settingModel.find()

    return res.status(200).json({
      success: true,
      message: "All Settings Info",
      data: settingInfo,
    })
  } catch (err) {
    console.error(colors.bgRed.white(`${err}`))
    res.status(500).json({
      success: false,
      message: "Error in getting All Settings",
      err: err.message,
    })
  }
}

export const updateOneSettingController = async (req, res) => {
  try { 
    
    const { _id, name, type, value, unit, description } = req.body
    const result = await settingModel.findById(_id)
    if (!result) {
      res.status(404).send(sendResponse(false, null, "Data not found"))
    } else {
      const update = { name, type, value, unit, description }

      const updatedVariable = await settingModel.findByIdAndUpdate(
        _id,
        update,
        { new: true }
      )
      if (updatedVariable)
        return res.status(200).json({
          data: updatedVariable,
          success: true,
          message: "Update one Variable in Settings",
        })
      else res.status(400).send(sendResponse(false, null, "Update Failed"))
    }
  } catch (err) {
    console.error(colors.bgRed.white(`${err}`))
    res.status(500).json({
      success: false,
      message: "Error in updating one variable in settings",
      err: err.message,
    })
  }
}
