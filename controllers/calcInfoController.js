import colors from "colors"
import settingModel from "../models/settingModel.js"
import platesModel from "../models/platesModel.js"
import edgeModel from "../models/edgeModel.js"
import platesTypesModel from "../models/platesTypesModel.js"
import AssestsModel from "../models/Assests/AssestsModel.js"

export const getCalcInfoController = async (req, res) => {
  try {
    const result = {}
    result.info = {}

    const settingInfo = await settingModel.find()

    settingInfo.forEach((item) => {
      result.info[item.name] = item.value
    })

    result.plates_edges = {}
    const plates = await platesModel.find()

    for (const item of plates) {
      const edge = await edgeModel.findOne({ plate_Id_match: item.configId })
      result.plates_edges[`${item.name}-${item.plate_thickness}`] = {
        plate_price:
          Number(item.plate_cost) +
          (Number(item.plate_cost) * Number(item.price_increase)) / 100,
        edge_name: edge.name,
        edge_price:
          Number(edge.edge_cost) +
          (Number(edge.edge_cost) * Number(edge.price_aufschlag)) / 100,
      }
    }

    result.plates_types = {}
    const platesTypes = await platesTypesModel.find()
    for (const item of platesTypes) {
      result.plates_types[item.name] = {
        edge_type: item.edge_0,
        list: item.list,
      }
    }

    result.assets = {}
    const assets = await AssestsModel.find()
    for (const item of assets) {
      result.assets[item.configId] = {
        name: item.name,
        price:
          Number(item.price_einkauf) +
          (Number(item.price_einkauf) * Number(item.price_aufschlag)) / 100,
      }
    }

    return res.status(200).json({
      success: true,
      message: "Calculation Info",
      data: result,
    })
  } catch (err) {
    console.error(colors.bgRed.white(`${err}`))
    res.status(500).json({
      success: false,
      message: "Error in getting Calculation Info",
      err: err.message,
    })
  }
}
