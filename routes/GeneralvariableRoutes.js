import express from "express";
import PDFDocument from 'pdfkit';

import sendResponse from "../helpers/helper.js";
import { verifyAdminToken } from "../middelwares/Tokenverification.js";
import GeneralvariableScheme from "../models/GeneralcalculationVariableModel.js";
import calculationVariable from "../models/MaterialcalculationVariableModel.js";
import WorkingvariableScheme from "../models/WorkingcalculationVariableModel.js";
import FeesvariableScheme from "../models/FeescalculationVariableModel.js";
import upload from "../Middle/Multer.js";
import platesModel from "../models/platesModel.js";
import TestPartList from "../models/testPartListModel.js";
import edgeModel from "../models/edgeModel.js";
import AssestsModel from "../models/Assests/AssestsModel.js";
import { createWriteStream, createReadStream, unlink } from 'fs';

const GeneralCalculationRouter = express.Router();
const loadPDFKit = async () => {
  if (!PDFDocument) {
    PDFDocument = (await import('pdfkit')).default;
  }
};

GeneralCalculationRouter.post(
  "/CreateGeneralVariable",
    verifyAdminToken,
  upload,
  async (req, res) => {
    try {
      const { variableName, ConfigId, test_total } = req.body;
      let nextId = 1;
      const existingvariable = await GeneralvariableScheme.find(
        {},
        { config_id: 1 },
        { sort: { config_id: 1 } }
      );
      const existingIds = existingvariable.map((plate) =>
        parseInt(plate.config_id.slice(3), 10)
      );
      while (existingIds.includes(nextId)) {
        nextId++;
      }
      const formattedCounter = nextId.toString().padStart(4, "0");
      const newvariableID = `EP_${formattedCounter}`;
      const newVariable = new GeneralvariableScheme({
        variable_name: variableName,
        config_id: newvariableID,
        test_total: "00",
      });
      const savedVariable = await newVariable.save();
      const allVariables = await GeneralvariableScheme.find();
      res.status(201).json({
        success: true,
        data: allVariables,
        message: "Variable created successfully",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  }
);

GeneralCalculationRouter.post(
  "/addDataToGeneralVariable",
  verifyAdminToken,
  upload,
  async (req, res) => {
    try {
      const { variable_name, configId, material_items, test_total } = req.body;
      const data = await GeneralvariableScheme.findOne({ config_id: configId });

      if (data == null || data?.length === 0) {
        return res
          .status(404)
          .send(sendResponse(false, null, "No such Variable found."));
      }
      if (!data.material_items || data.material_items.length === 0) {
        material_items?.forEach((item) => {
          if (item.type.includes("addvariable") || item.type.includes("addfunction")) {
            data?.material_items?.push({
              type: item?.type,
              variable_name: item?.variable_name,
              VariableType: item?.VariableType,
              config_id: item?.config_id,
              test_result: item?.test_result,
              // test_total: item?.test_total, // Include test_total here
            });
          } else {
            data?.material_items?.push({
              type: item?.type,
              value: item?.value,
              // test_total: item?.test_total, // Include test_total here
            });
          }
        });
      } else {
        data.material_items = [];
        material_items?.forEach((item) => {
          if (item.type.includes("addvariable") || item.type.includes("addfunction")) {
            data?.material_items?.push({
              type: item?.type,
              variable_name: item?.variable_name,
              VariableType: item?.VariableType,
              config_id: item?.config_id,
              test_result: item?.test_result,
            });
          } else {
            data?.material_items?.push({
              type: item?.type,
              value: item?.value,
            });
          }
        });
      }
      // Add test_total to the main object
      data.test_total = test_total;

      const updatedVariable = await data.save();

      const allVariables = await GeneralvariableScheme.find();
      res.status(201).json({
        success: true,
        data: updatedVariable,
        message: "Created successfully",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  }
);

GeneralCalculationRouter.post(
  "/searchByGeneralConfigid",
  upload,
  async (req, res) => {
    try {
      const { configId } = req.body;
      let searchConfigId = await GeneralvariableScheme.find({
        config_id: configId,
      });

      if (Array.isArray(searchConfigId) && searchConfigId?.length === 0) {
        return res
          .status(404)
          .send(sendResponse(false, null, "This config id does not exist"));
      }
      return res.send(sendResponse(true, searchConfigId));
    } catch (error) {
      console.error(error);
      res.status(500).send(sendResponse(false, null, "Internal Server Error"));
    }
  }
);

GeneralCalculationRouter.get("/dropIndexes", async (req, res) => {
  GeneralvariableScheme.collection.dropIndexes(function (err, result) {
    res.end();
  });
});
GeneralCalculationRouter.get(
  "/generateConfigId",
  verifyAdminToken,
  async (req, res) => {
    let nextId = 1;
    const existingVariables = await GeneralvariableScheme.find(
      {},
      { config_id: 1 },
      { sort: { config_id: 1 } }
    );
    const existingIds = existingVariables.map((variable) =>
      parseInt(variable.config_id.slice(3), 10)
    );
    while (existingIds.includes(nextId)) {
      nextId++;
    }

    const formattedCounter = nextId.toString().padStart(4, "0");
    const newVariableId = `MT_${formattedCounter}`;
    res.send({ configId: newVariableId });
  }
);

GeneralCalculationRouter.get(
  "/getGeneralVariables",
  verifyAdminToken,
  async (req, res) => {
    try {
      const variables = await GeneralvariableScheme.find().populate(
        "material_items"
      );
      res.send(sendResponse(true, variables, "Successfully fetch"));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

GeneralCalculationRouter.post(
  "/searchVariables",
  verifyAdminToken,
  async (req, res) => {
    try {
      const { configId } = req.body; // Assuming the search query is sent in the body of the POST request

      // Search in all schemas without including material_items in the result
      const variables = await GeneralvariableScheme.find({ config_id: configId }, '-material_items');
      const variables2 = await calculationVariable.find({ config_id: configId }, '-material_items');
      const variables3 = await WorkingvariableScheme.find({ config_id: configId }, '-material_items');
      const variables4 = await FeesvariableScheme.find({ config_id: configId }, '-material_items');

      // Combine the results from all schemas
      const combinedVariables = [...variables, ...variables2, ...variables3, ...variables4];

      res.status(200).json({
        status: true,
        data: combinedVariables,
        message: "Successfully fetched"
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: false, error: "Internal Server Error" });
    }
  }
);

async function calculateSquareMeterSumForMaterial(plates, testParts, targetThickness, count) {
  let totalSum = 0;
  // Filter plates by the target thickness.
  const filteredPlates = plates.filter(plate => plate.plate_thickness === targetThickness);
  // Iterate over each filtered plate.
  let finalOutput = 0;
  let found_count = 0;
  for (let plate of filteredPlates) {
      // Find test parts that match the material name of the current plate.
      const matchingTestParts = testParts.filter(testPart => testPart.MaterialName === plate.name);

      let sumForCurrentPlate = 0;
      for (let testPart of matchingTestParts) {
          const result = parseFloat(parseFloat(testPart.PlateDepth) * parseFloat(testPart.PlateLength)) / 1000000;
          sumForCurrentPlate += result;
      }
      if (sumForCurrentPlate > 0) {
        finalOutput += sumForCurrentPlate;
        found_count += 1;
      }
      if(count == found_count) {
        break;
      }
  }

  if (finalOutput > 0) {
    return parseFloat(finalOutput).toFixed(2);
  }
  return totalSum;
}


function calculateEdgeSize(edge_0, PlateDepth, PlateLength) {
  const edges = edge_0.split(""); // Split the string into individual characters
  let edgeSize = 0;
  // Parse PlateDepth and PlateLength to numbers
  const depth = parseInt(PlateDepth, 10);
  const length = parseInt(PlateLength, 10);

  edges.forEach(edge => {
      switch (edge) {
          case 'V': // Vertical edges
              edgeSize += length;
              break;
          case 'H': // Horizontal edges, corrected to add depth
              edgeSize += depth; 
              break;
          case 'L': // Left edge
              edgeSize += depth;
              break;
          case 'R': // Right edge
              edgeSize += depth;
              break;
          default:
              break;
      }
  });
  return edgeSize;
}

async function calculateEdgeLengthSumForMaterial(plates, testParts, targetThickness, count) {
  let totalSum = 0;
  // Filter plates by the target thickness.
  const filteredPlates = plates.filter(plate => plate.plate_thickness === targetThickness);
  // Iterate over each filtered plate.
  let finalOutput = 0;
  let found_count = 0;
  for (let plate of filteredPlates) {
      // Find test parts that match the material name of the current plate.
      const matchingTestParts = testParts.filter(testPart => testPart.MaterialName === plate.name);

      let sumForCurrentEdge = 0;
      for (let testPart of matchingTestParts) {
          const result = calculateEdgeSize(testPart.edge_0, testPart.PlateDepth, testPart.PlateLength);
          sumForCurrentEdge += result;
      }
      if (sumForCurrentEdge > 0) {
        finalOutput += sumForCurrentEdge;
        found_count += 1;
      }
      if(count == found_count) {
        break;
      }
  }

  if (finalOutput > 0) {
    return parseFloat(finalOutput).toFixed(2);
  }
  return totalSum;
}

async function getAssetsCounts(plates) { // Mark this function as async
  const uniqueConfigIds = new Set();

  // Collect unique configIds starting with 'A_'
  plates.forEach(plate => {
    plate.list.forEach(item => {
      item.child_config_id.forEach(configId => {
        if (configId.startsWith('A_')) {
          uniqueConfigIds.add(configId);
        }
      });
    });
  });

  const configIdsArray = [...uniqueConfigIds]; // Convert Set to Array

  if (configIdsArray.length > 0) {
    try {
      const assets = await AssestsModel.find({ configId: { $in: configIdsArray } }); // Now correctly within an async function
      // Ensure that 'assets' is an array before using .reduce()
      if (Array.isArray(assets)) {
        const totalPrice = assets.reduce((acc, curr) => acc + (Number(curr.price_einkauf) || 0), 0);
        return totalPrice;
      } else {
        console.error("Expected 'assets' to be an array, but it was not.");
        return 0; // Or handle as appropriate for your application
      }
    } catch (error) {
      console.error("Error fetching assets:", error);
      throw error;
    }
  } else {
    console.log("No configIds found starting with 'A_'.");
    return 0;
  }
}


  
function getTotalPlate(plates) {
  return plates.length;
}
function calculateTotalEdgeLength(plates) {
  let totalCutLength = 0;

  plates.forEach(plate => {
    const edgeLength = calculateEdgeSize(plate.edge_0, plate.PlateDepth, plate.PlateLength);
    totalCutLength += edgeLength; // Add to total
  });

  const totalCutLengthInMeters = totalCutLength / 1000;
  return totalCutLengthInMeters;
}

function calculateTotalPlateCutLength(plates) {
  let totalCutLength = 0;

  plates.forEach(plate => {
    const plateCutLength = 2 * (plate.PlateDepth + plate.PlateLength);
    totalCutLength += plateCutLength; // Add to total
  });

  const totalCutLengthInMeters = totalCutLength / 1000;
  return parseFloat(totalCutLengthInMeters).toFixed(2);
}



async function calculateEdgeLengthCostSumForMaterial(plates, testParts, targetThickness, count) {
  
  let totalSum = 0;
  const filteredPlates = plates.filter(plate => plate.plate_thickness === targetThickness);
  let finalOutput = 0;
  let sizeCurrentPlate = 0;
  let found_count = 0;
  if(filteredPlates.length > 0) {
    for (let i = 0; i < filteredPlates.length; i++) {
        // Find test parts that match the material name of the current plate.
        const matchingTestParts = testParts.filter(testPart => testPart.MaterialName === filteredPlates[i].name);
        const matchingEdges = await edgeModel.find({ plate_Id_match: filteredPlates[i].configId });
        if(matchingEdges.length > 0) {
          let sumForCurrentPlate = 0;
          for (let testPart of matchingTestParts) {
              const result = calculateEdgeSize(testPart.edge_0, testPart.PlateDepth, testPart.PlateLength);
              sumForCurrentPlate += result;
          }
          if (sumForCurrentPlate > 0) {
            sizeCurrentPlate += sumForCurrentPlate;
            found_count += 1;
          }
        }
        if(count == found_count || i === filteredPlates.length - 1) {
          let converttoM = sizeCurrentPlate / 1000;
          if(matchingEdges.length > 0) {
            finalOutput = converttoM * matchingEdges[0].edge_cost;
          } else {
            finalOutput = converttoM;
          }
          break;
        }
    }
  }
    
  
  if (finalOutput > 0) {
    return parseFloat(finalOutput).toFixed(2);
  }
  return totalSum;
}


async function calculatePlatePriceSumForMaterial(plates, testParts, targetThickness, count) {
  let totalSum = 0;
  // Filter plates by the target thickness.
  const filteredPlates = plates.filter(plate => plate.plate_thickness === targetThickness);
  // Iterate over each filtered plate.
  let finalOutput = 0;
  let sizeCurrentPlate = 0;
  let found_count = 0;
  for (let i = 0; i < filteredPlates.length; i++) {
      // Find test parts that match the material name of the current plate.
      const matchingTestParts = testParts.filter(testPart => testPart.MaterialName === filteredPlates[i].name);

      let sumForCurrentPlate = 0;
      for (let testPart of matchingTestParts) {
          const result = parseFloat((parseFloat(testPart.PlateDepth) * parseFloat(testPart.PlateLength)) / 1000000);
          sumForCurrentPlate += result;
      }
      if (sumForCurrentPlate > 0) {
        sizeCurrentPlate += sumForCurrentPlate;
        found_count += 1;
      }
      
      if(count == found_count || i === filteredPlates.length - 1) {
        let plate_length = filteredPlates[i]?.plate_length;
        let plate_width = filteredPlates[i]?.plate_width;
        let plate_size_m2 = parseFloat(plate_length * plate_width / 1000000);
        let plate_cost = filteredPlates[i]?.plate_cost * plate_size_m2;
        if(sizeCurrentPlate > plate_size_m2) {
          let multiplePlateBy = sizeCurrentPlate / plate_size_m2;
          finalOutput = plate_cost * multiplePlateBy;
        } else {
          finalOutput = plate_cost;
        }
        break;
      }
  }

  if (finalOutput > 0) {
    return parseFloat(finalOutput).toFixed(2);
  }
  return totalSum;
}

async function getStaticData() {
  const platesResponse = await platesModel.find();
  
  const testPartsResponse = await TestPartList.find();
  const staticData = [
    { "_id": "FU_0001", "variable_name": "Plate(01)-19-square", "config_id": "FU_0001", "test_total": await calculateSquareMeterSumForMaterial(platesResponse, testPartsResponse, "19", "1"), "material_items": [], "__v": 0},
    { "_id": "FU_0002", "variable_name": "Plate(02)-19-square", "config_id": "FU_0002", "test_total": await calculateSquareMeterSumForMaterial(platesResponse, testPartsResponse, "19", "2"), "material_items": [], "__v": 0},
    { "_id": "FU_0003", "variable_name": "Plate(03)-19-square", "config_id": "FU_0003", "test_total": await calculateSquareMeterSumForMaterial(platesResponse, testPartsResponse, "19", "3"), "material_items": [], "__v": 0},
    { "_id": "FU_0004", "variable_name": "Plate(04)-19-square", "config_id": "FU_0004", "test_total": await calculateSquareMeterSumForMaterial(platesResponse, testPartsResponse, "19", "4"), "material_items": [], "__v": 0},
    { "_id": "FU_0005", "variable_name": "Plate(01)-16-square", "config_id": "FU_0005", "test_total": await calculateSquareMeterSumForMaterial(platesResponse, testPartsResponse, "16", "1"), "material_items": [], "__v": 0},
    { "_id": "FU_0006", "variable_name": "Plate(01)-8-square", "config_id": "FU_0006", "test_total": await calculateSquareMeterSumForMaterial(platesResponse, testPartsResponse, "8", "1"), "material_items": [], "__v": 0},
    { "_id": "FU_0007", "variable_name": "Plate(01)-19-cost", "config_id": "FU_0007", "test_total": await calculatePlatePriceSumForMaterial(platesResponse, testPartsResponse, "19", "1"), "material_items": [], "__v": 0},
    { "_id": "FU_0008", "variable_name": "Plate(02)-19-cost", "config_id": "FU_0008", "test_total": await calculatePlatePriceSumForMaterial(platesResponse, testPartsResponse, "19", "2"), "material_items": [], "__v": 0},
    { "_id": "FU_0009", "variable_name": "Plate(03)-19-cost", "config_id": "FU_0009", "test_total": await calculatePlatePriceSumForMaterial(platesResponse, testPartsResponse, "19", "3"), "material_items": [], "__v": 0},
    { "_id": "FU_0010", "variable_name": "Plate(04)-19-cost", "config_id": "FU_0010", "test_total": await calculatePlatePriceSumForMaterial(platesResponse, testPartsResponse, "19", "4"), "material_items": [], "__v": 0},
    { "_id": "FU_0011", "variable_name": "Plate(01)-16-cost", "config_id": "FU_0011", "test_total": await calculatePlatePriceSumForMaterial(platesResponse, testPartsResponse, "16", "1"), "material_items": [], "__v": 0},
    { "_id": "FU_0012", "variable_name": "Plate(01)-8-cost", "config_id": "FU_0012", "test_total": await calculatePlatePriceSumForMaterial(platesResponse, testPartsResponse, "8", "1"), "material_items": [], "__v": 0},
    { "_id": "FU_0013", "variable_name": "Edge(01)-19-length", "config_id": "FU_0013", "test_total": await calculateEdgeLengthSumForMaterial(platesResponse, testPartsResponse, "19", "1"), "material_items": [], "__v": 0},
    { "_id": "FU_0014", "variable_name": "Edge(02)-19-length", "config_id": "FU_0014", "test_total": await calculateEdgeLengthSumForMaterial(platesResponse, testPartsResponse, "19", "2"), "material_items": [], "__v": 0},
    { "_id": "FU_0015", "variable_name": "Edge(03)-19-length", "config_id": "FU_0015", "test_total": await calculateEdgeLengthSumForMaterial(platesResponse, testPartsResponse, "19", "3"), "material_items": [], "__v": 0},
    { "_id": "FU_0016", "variable_name": "Edge(04)-19-length", "config_id": "FU_0016", "test_total": await calculateEdgeLengthSumForMaterial(platesResponse, testPartsResponse, "19", "4"), "material_items": [], "__v": 0},
    { "_id": "FU_0017", "variable_name": "Edge(01)-16-length", "config_id": "FU_0017", "test_total": await calculateEdgeLengthSumForMaterial(platesResponse, testPartsResponse, "16", "1"), "material_items": [], "__v": 0},
    { "_id": "FU_0018", "variable_name": "Edge(01)-19-cost", "config_id": "FU_0018", "test_total": await calculateEdgeLengthCostSumForMaterial(platesResponse, testPartsResponse, "19", "1"), "material_items": [], "__v": 0},
    { "_id": "FU_0019", "variable_name": "Edge(02)-19-cost", "config_id": "FU_0019", "test_total": await calculateEdgeLengthCostSumForMaterial(platesResponse, testPartsResponse, "19", "2"), "material_items": [], "__v": 0},
    { "_id": "FU_0020", "variable_name": "Edge(03)-19-cost", "config_id": "FU_0020", "test_total": await calculateEdgeLengthCostSumForMaterial(platesResponse, testPartsResponse, "19", "3"), "material_items": [], "__v": 0},
    { "_id": "FU_0021", "variable_name": "Edge(04)-19-cost", "config_id": "FU_0021", "test_total": await calculateEdgeLengthCostSumForMaterial(platesResponse, testPartsResponse, "19", "4"), "material_items": [], "__v": 0},
    { "_id": "FU_0022", "variable_name": "Edge(01)-16-cost", "config_id": "FU_0022", "test_total": await calculateEdgeLengthCostSumForMaterial(platesResponse, testPartsResponse, "16", "1"), "material_items": [], "__v": 0},
    { "_id": "FU_0023", "variable_name": "Plate-cut-length", "config_id": "FU_0023", "test_total": await calculateTotalPlateCutLength(testPartsResponse), "material_items": [], "__v": 0},
    { "_id": "FU_0024", "variable_name": "Plate-Edge-length", "config_id": "FU_0024", "test_total": await calculateTotalEdgeLength(testPartsResponse), "material_items": [], "__v": 0},
    { "_id": "FU_0025", "variable_name": "Plate-Edge-total", "config_id": "FU_0025", "test_total": "00", "material_items": [], "__v": 0},
    { "_id": "FU_0026", "variable_name": "Plate-Pcs-total", "config_id": "FU_0026", "test_total": await getTotalPlate(testPartsResponse), "material_items": [], "__v": 0},
    { "_id": "FU_0027", "variable_name": "Assets-Pcs-total", "config_id": "FU_0027", "test_total": await getAssetsCounts(testPartsResponse), "material_items": [], "__v": 0},
  ]
  return staticData;
}

function getAssets(data) {
  let assets = [];
  data.forEach(item => {
      if (item.list && item.list.length > 0) {
          item.list.forEach(listItem => {
              if (listItem.child_config_id && listItem.child_config_id[0].startsWith('A_')) {
                  assets.push({
                      MaterialName: listItem.child_name[0],
                      supplier_id: listItem.supplier_id[0],
                      Quantity: listItem.qty[0]
                  });
              }
          });
      }
  });
  return assets;
}

async function createCalculationPDF(general_variables, material_variables, working_variables, fees_variables, callback) {
  await loadPDFKit();
  const doc = new PDFDocument();
  const stream = createWriteStream('output.pdf');
  doc.pipe(stream);
  const pageCenter = doc.page.width / 2;
  const rowColors = ["#EEE", "#FFF"]; // Array of colors to use for alternating rows
  let isColoredRow = true; // Start with the first color

  doc.font('Helvetica-Bold');
  doc.fontSize(16).text('Furniture-ID: 1234', 50, 50);
  doc.fontSize(18).text('Calculation', 50, 40, { align: 'center' });
  doc.fontSize(16).text('Order-Nr: 1234', doc.page.width - 200, 50, { align: 'right' });

  doc.moveTo(50, 70).lineTo(550, 70).lineWidth(3).strokeColor('black').stroke();
  doc.font('Helvetica');

  const platesTitleWidth = 100;
  const platesTitleHeight = 20;
  const platesTitleX = pageCenter - (platesTitleWidth / 2);
  let platesTitleY = 100;
  
  doc.roundedRect(platesTitleX, platesTitleY, platesTitleWidth, platesTitleHeight, 5)
     .fillAndStroke("#F6F6F6", "#000"); // white fill, black stroke

  doc.fillColor('black');
  doc.fontSize(12).text('General', platesTitleX, platesTitleY + (platesTitleHeight / 2) - (doc.currentLineHeight() / 2), { width: platesTitleWidth, align: 'center' });

  let startY = 150;
  doc.font('Helvetica').fontSize(10);

  const titles = ['Variable-Name', 'Config-ID', 'Value'];
  const positions = [120, 260, 310]; // X positions for the titles
  
  titles.forEach((title, index) => {
    const titleWidth = doc.widthOfString(title);
    const titleHeight = doc.currentLineHeight();
    
    doc.text(title, positions[index], startY);
  
    doc.moveTo(positions[index], startY + titleHeight - 2)
       .lineTo(positions[index] + titleWidth, startY + titleHeight - 2)
       .lineWidth(0.5)
       .stroke();
  });

  startY += 20;

  const rowHeight = 20;
  const columnWidths = [200, 50, 50]; // Adjust the widths as necessary

  general_variables.forEach(item => {
    if (checkAndAddNewPage(doc, startY)) {
      startY = 50; // Reset startY for the new page, adjust this value based on your header size
    }
    doc.rect(50, startY, columnWidths[0], rowHeight).fillAndStroke(isColoredRow ? rowColors[0] : rowColors[1], "#000");
    doc.rect(250, startY, columnWidths[1], rowHeight).fillAndStroke(isColoredRow ? rowColors[0] : rowColors[1], "#000");
    doc.rect(300, startY, columnWidths[2], rowHeight).fillAndStroke(isColoredRow ? rowColors[0] : rowColors[1], "#000");
    isColoredRow = !isColoredRow;

    doc.fillColor('black');

    doc.text(item?.variable_name, 50, startY + (rowHeight / 2) - (doc.currentLineHeight() / 2), { width: columnWidths[0], align: 'center' });
    doc.text(item.config_id ? `${item.config_id}` : '', 250, startY + (rowHeight / 2) - (doc.currentLineHeight() / 2), { width: columnWidths[1], align: 'center' });
    doc.text(item.test_total ? `${item.test_total}` : '', 300, startY + (rowHeight / 2) - (doc.currentLineHeight() / 2), { width: columnWidths[2], align: 'center' });

    startY += rowHeight;
  });
  if (checkAndAddNewPage(doc, startY)) {
    startY = 50; // Reset startY for the new page, adjust this value based on your header size
  }
  platesTitleY = startY + 20;
  
  doc.moveTo(50, startY+10).lineTo(550, startY + 10).lineWidth(3).strokeColor('black').stroke();
  
  doc.roundedRect(platesTitleX, platesTitleY, platesTitleWidth, platesTitleHeight, 5)
     .fillAndStroke("#F6F6F6", "#000"); // white fill, black stroke

  doc.fillColor('black');
  doc.fontSize(12).text('Material', platesTitleX, platesTitleY + (platesTitleHeight / 2) - (doc.currentLineHeight() / 2), { width: platesTitleWidth, align: 'center' });

  startY += 50;
  doc.font('Helvetica').fontSize(10);

  
  titles.forEach((title, index) => {
    const titleWidth = doc.widthOfString(title);
    const titleHeight = doc.currentLineHeight();
    
    doc.text(title, positions[index], startY);
  
    doc.moveTo(positions[index], startY + titleHeight - 2)
       .lineTo(positions[index] + titleWidth, startY + titleHeight - 2)
       .lineWidth(0.5)
       .stroke();
  });

  startY += 20;

  isColoredRow = true; // Start with the first color

  material_variables.forEach(item => {
    if (checkAndAddNewPage(doc, startY)) {
      startY = 50; // Reset startY for the new page, adjust this value based on your header size
    }
    doc.rect(50, startY, columnWidths[0], rowHeight).fillAndStroke(isColoredRow ? rowColors[0] : rowColors[1], "#000");
    doc.rect(250, startY, columnWidths[1], rowHeight).fillAndStroke(isColoredRow ? rowColors[0] : rowColors[1], "#000");
    doc.rect(300, startY, columnWidths[2], rowHeight).fillAndStroke(isColoredRow ? rowColors[0] : rowColors[1], "#000");
    isColoredRow = !isColoredRow;

    doc.fillColor('black');

    doc.text(item?.variable_name, 50, startY + (rowHeight / 2) - (doc.currentLineHeight() / 2), { width: columnWidths[0], align: 'center' });
    doc.text(item.config_id ? `${item.config_id}` : '', 250, startY + (rowHeight / 2) - (doc.currentLineHeight() / 2), { width: columnWidths[1], align: 'center' });
    doc.text(item.test_total ? `${item.test_total}` : '', 300, startY + (rowHeight / 2) - (doc.currentLineHeight() / 2), { width: columnWidths[2], align: 'center' });

    startY += rowHeight;
  });


  if (checkAndAddNewPage(doc, startY)) {
    startY = 50; // Reset startY for the new page, adjust this value based on your header size
  }
  platesTitleY = startY + 20;

  doc.moveTo(50, startY+10).lineTo(550, startY+10).lineWidth(3).strokeColor('black').stroke();
  
  doc.roundedRect(platesTitleX, platesTitleY, platesTitleWidth, platesTitleHeight, 5)
     .fillAndStroke("#F6F6F6", "#000"); // white fill, black stroke

  doc.fillColor('black');
  doc.fontSize(12).text('Working-Time', platesTitleX, platesTitleY + (platesTitleHeight / 2) - (doc.currentLineHeight() / 2), { width: platesTitleWidth, align: 'center' });

  startY += 50;
  doc.font('Helvetica').fontSize(10);

  
  titles.forEach((title, index) => {
    const titleWidth = doc.widthOfString(title);
    const titleHeight = doc.currentLineHeight();
    
    doc.text(title, positions[index], startY);
  
    doc.moveTo(positions[index], startY + titleHeight - 2)
       .lineTo(positions[index] + titleWidth, startY + titleHeight - 2)
       .lineWidth(0.5)
       .stroke();
  });

  startY += 20;

  isColoredRow = true; // Start with the first color

  working_variables.forEach(item => {
    if (checkAndAddNewPage(doc, startY)) {
      startY = 50; // Reset startY for the new page, adjust this value based on your header size
    }
    doc.rect(50, startY, columnWidths[0], rowHeight).fillAndStroke(isColoredRow ? rowColors[0] : rowColors[1], "#000");
    doc.rect(250, startY, columnWidths[1], rowHeight).fillAndStroke(isColoredRow ? rowColors[0] : rowColors[1], "#000");
    doc.rect(300, startY, columnWidths[2], rowHeight).fillAndStroke(isColoredRow ? rowColors[0] : rowColors[1], "#000");
    isColoredRow = !isColoredRow;

    doc.fillColor('black');

    doc.text(item?.variable_name, 50, startY + (rowHeight / 2) - (doc.currentLineHeight() / 2), { width: columnWidths[0], align: 'center' });
    doc.text(item.config_id ? `${item.config_id}` : '', 250, startY + (rowHeight / 2) - (doc.currentLineHeight() / 2), { width: columnWidths[1], align: 'center' });
    doc.text(item.test_total ? `${item.test_total}` : '', 300, startY + (rowHeight / 2) - (doc.currentLineHeight() / 2), { width: columnWidths[2], align: 'center' });

    startY += rowHeight;
  });



  if (checkAndAddNewPage(doc, startY)) {
    startY = 50; // Reset startY for the new page, adjust this value based on your header size
  }
  platesTitleY = startY + 20;

  doc.moveTo(50, startY+10).lineTo(550, startY+10).lineWidth(3).strokeColor('black').stroke();
  
  doc.roundedRect(platesTitleX, platesTitleY, platesTitleWidth, platesTitleHeight, 5)
     .fillAndStroke("#F6F6F6", "#000"); // white fill, black stroke

  doc.fillColor('black');
  doc.fontSize(12).text('Fees', platesTitleX, platesTitleY + (platesTitleHeight / 2) - (doc.currentLineHeight() / 2), { width: platesTitleWidth, align: 'center' });

  startY += 50;
  doc.font('Helvetica').fontSize(10);

  
  titles.forEach((title, index) => {
    const titleWidth = doc.widthOfString(title);
    const titleHeight = doc.currentLineHeight();
    
    doc.text(title, positions[index], startY);
  
    doc.moveTo(positions[index], startY + titleHeight - 2)
       .lineTo(positions[index] + titleWidth, startY + titleHeight - 2)
       .lineWidth(0.5)
       .stroke();
  });

  startY += 20;

  isColoredRow = true; // Start with the first color

  fees_variables.forEach(item => {
    if (checkAndAddNewPage(doc, startY)) {
      startY = 50; // Reset startY for the new page, adjust this value based on your header size
    }
    doc.rect(50, startY, columnWidths[0], rowHeight).fillAndStroke(isColoredRow ? rowColors[0] : rowColors[1], "#000");
    doc.rect(250, startY, columnWidths[1], rowHeight).fillAndStroke(isColoredRow ? rowColors[0] : rowColors[1], "#000");
    doc.rect(300, startY, columnWidths[2], rowHeight).fillAndStroke(isColoredRow ? rowColors[0] : rowColors[1], "#000");
    isColoredRow = !isColoredRow;

    doc.fillColor('black');

    doc.text(item?.variable_name, 50, startY + (rowHeight / 2) - (doc.currentLineHeight() / 2), { width: columnWidths[0], align: 'center' });
    doc.text(item.config_id ? `${item.config_id}` : '', 250, startY + (rowHeight / 2) - (doc.currentLineHeight() / 2), { width: columnWidths[1], align: 'center' });
    doc.text(item.test_total ? `${item.test_total}` : '', 300, startY + (rowHeight / 2) - (doc.currentLineHeight() / 2), { width: columnWidths[2], align: 'center' });

    startY += rowHeight;
  });




  doc.end();
  stream.on('finish', () => callback('output.pdf'));
}

function checkAndAddNewPage(doc, currentY) {
  const pageHeight = doc.page.height;
  const bottomMargin = 90; // Adjust based on your needs
  if (currentY > (pageHeight - bottomMargin)) {
    console.log(currentY);
    console.log(pageHeight);
    doc.addPage();
    return true; // New page was added
  }
  return false; // No new page needed
}


async function createPDF(data, assets, callback) {
  await loadPDFKit();
  const doc = new PDFDocument();
  const stream = createWriteStream('output.pdf');
  doc.pipe(stream);
  const pageCenter = doc.page.width / 2;
  const rowColors = ["#EEE", "#FFF"]; // Array of colors to use for alternating rows
  let isColoredRow = true; // Start with the first color

  doc.font('Helvetica-Bold');
  doc.fontSize(16).text('Furniture-ID: 1234', 50, 50);
  doc.fontSize(18).text('Part-List', 50, 40, { align: 'center' });
  doc.fontSize(16).text('Order-Nr: 1234', doc.page.width - 200, 50, { align: 'right' });

  doc.moveTo(50, 70).lineTo(550, 70).lineWidth(3).strokeColor('black').stroke();
  doc.font('Helvetica');

  const platesTitleWidth = 100;
  const platesTitleHeight = 20;
  const platesTitleX = pageCenter - (platesTitleWidth / 2);
  let platesTitleY = 100;
  
  doc.roundedRect(platesTitleX, platesTitleY, platesTitleWidth, platesTitleHeight, 5)
     .fillAndStroke("#F6F6F6", "#000"); // white fill, black stroke

  doc.fillColor('black');
  doc.fontSize(12).text('Plates', platesTitleX, platesTitleY + (platesTitleHeight / 2) - (doc.currentLineHeight() / 2), { width: platesTitleWidth, align: 'center' });

  let startY = 150;
  doc.font('Helvetica').fontSize(10);

  const titles = ['Material-Name', 'Depth', 'Length', 'Edge', 'Plate'];
  const positions = [120, 260, 310, 360, 435]; // X positions for the titles
  
  titles.forEach((title, index) => {
    const titleWidth = doc.widthOfString(title);
    const titleHeight = doc.currentLineHeight();
    
    doc.text(title, positions[index], startY);
  
    doc.moveTo(positions[index], startY + titleHeight - 2)
       .lineTo(positions[index] + titleWidth, startY + titleHeight - 2)
       .lineWidth(0.5)
       .stroke();
  });

  startY += 20;

  const rowHeight = 20;
  const columnWidths = [200, 50, 50, 50, 100]; // Adjust the widths as necessary

  data.forEach(item => {
    if (checkAndAddNewPage(doc, startY)) {
      startY = 50; // Reset startY for the new page, adjust this value based on your header size
    }
    doc.rect(50, startY, columnWidths[0], rowHeight).fillAndStroke(isColoredRow ? rowColors[0] : rowColors[1], "#000");
    doc.rect(250, startY, columnWidths[1], rowHeight).fillAndStroke(isColoredRow ? rowColors[0] : rowColors[1], "#000");
    doc.rect(300, startY, columnWidths[2], rowHeight).fillAndStroke(isColoredRow ? rowColors[0] : rowColors[1], "#000");
    doc.rect(350, startY, columnWidths[3], rowHeight).fillAndStroke(isColoredRow ? rowColors[0] : rowColors[1], "#000");
    doc.rect(400, startY, columnWidths[4], rowHeight).fillAndStroke(isColoredRow ? rowColors[0] : rowColors[1], "#000");
    isColoredRow = !isColoredRow;

    doc.fillColor('black');

    doc.text(item?.MaterialName, 50, startY + (rowHeight / 2) - (doc.currentLineHeight() / 2), { width: columnWidths[0], align: 'center' });
    doc.text(item.PlateDepth ? `${item.PlateDepth} mm` : '', 250, startY + (rowHeight / 2) - (doc.currentLineHeight() / 2), { width: columnWidths[1], align: 'center' });
    doc.text(item.PlateLength ? `${item.PlateLength} mm` : '', 300, startY + (rowHeight / 2) - (doc.currentLineHeight() / 2), { width: columnWidths[2], align: 'center' });
    doc.text(item?.edge_0, 350, startY + (rowHeight / 2) - (doc.currentLineHeight() / 2), { width: columnWidths[3], align: 'center' });
    doc.text(item?.name, 400, startY + (rowHeight / 2) - (doc.currentLineHeight() / 2), { width: columnWidths[4], align: 'center' });

    startY += rowHeight;
  });
  if (checkAndAddNewPage(doc, startY)) {
    startY = 50; // Reset startY for the new page, adjust this value based on your header size
  }
  platesTitleY = startY + 20;
  
  doc.moveTo(50, startY+10).lineTo(550, startY + 10).lineWidth(3).strokeColor('black').stroke();
  
  doc.roundedRect(platesTitleX, platesTitleY, platesTitleWidth, platesTitleHeight, 5)
     .fillAndStroke("#F6F6F6", "#000"); // white fill, black stroke

  doc.fillColor('black');
  doc.fontSize(12).text('Assets', platesTitleX, platesTitleY + (platesTitleHeight / 2) - (doc.currentLineHeight() / 2), { width: platesTitleWidth, align: 'center' });

  startY += 50;
  doc.font('Helvetica').fontSize(10);

  const assetstitles = ['Material-Name', 'Supplier ID', 'Quantity'];
  const assetspositions = [50, 250, 310]; // X positions for the titles
  
  assetstitles.forEach((title, index) => {
    const titleWidth = doc.widthOfString(title);
    const titleHeight = doc.currentLineHeight();
    
    doc.text(title, assetspositions[index], startY);
  
    doc.moveTo(assetspositions[index], startY + titleHeight - 2)
       .lineTo(assetspositions[index] + titleWidth, startY + titleHeight - 2)
       .lineWidth(0.5)
       .stroke();
  });

  startY += 20;

  isColoredRow = true; // Start with the first color
  const AssetscolumnWidths = [200, 50, 60]; // Adjust the widths as necessary

  
  assets.forEach(item => {
    if (checkAndAddNewPage(doc, startY)) {
      startY = 50; // Reset startY for the new page, adjust this value based on your header size
    }
    doc.rect(50, startY, AssetscolumnWidths[0], rowHeight).fillAndStroke(isColoredRow ? rowColors[0] : rowColors[1], "#000");
    doc.rect(250, startY, AssetscolumnWidths[1], rowHeight).fillAndStroke(isColoredRow ? rowColors[0] : rowColors[1], "#000");
    doc.rect(300, startY, AssetscolumnWidths[2], rowHeight).fillAndStroke(isColoredRow ? rowColors[0] : rowColors[1], "#000");
    isColoredRow = !isColoredRow;

    doc.fillColor('black');

    doc.text(item?.MaterialName, 50, startY + (rowHeight / 2) - (doc.currentLineHeight() / 2), { width: AssetscolumnWidths[0], align: 'center' });
    doc.text(item.supplier_id, 250, startY + (rowHeight / 2) - (doc.currentLineHeight() / 2), { width: AssetscolumnWidths[1], align: 'center' });
    doc.text(item.Quantity, 300, startY + (rowHeight / 2) - (doc.currentLineHeight() / 2), { width: AssetscolumnWidths[2], align: 'center' });

    startY += rowHeight;
  });


  doc.end();
  stream.on('finish', () => callback('output.pdf'));
}



GeneralCalculationRouter.get("/calculationPDFdownload", async (req, res) => {
  try {
    const general_variables = await GeneralvariableScheme.find().populate("material_items");
    const material_variables = await calculationVariable.find().populate("material_items");
    const working_variables = await WorkingvariableScheme.find().populate("material_items");
    const fees_variables = await FeesvariableScheme.find().populate("material_items");

    await createCalculationPDF(general_variables, material_variables, working_variables, fees_variables, (filePath) => {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=output.pdf');
      
      // Pipe the file stream directly to the response
      const filestream = createReadStream(filePath);
      filestream.pipe(res);

      filestream.on('end', () => {
        unlink(filePath, (error) => {
          if (error) {
            console.error('Error deleting the PDF file', error);
          }
        }); // Delete the file after sending it
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

GeneralCalculationRouter.get("/platesPDFdownload", async (req, res) => {
  try {
    const plateData = await TestPartList.find();
    const uniqueAssets = await getUniqueAssets(plateData); // This function should return an array of assets
    await createPDF(plateData, uniqueAssets, (filePath) => {
      // Set the headers to display PDF inline in the browser
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=output.pdf');
      
      // Pipe the file stream directly to the response
      const filestream = createReadStream(filePath);
      filestream.pipe(res);

      filestream.on('end', () => {
        unlink(filePath, (error) => {
          if (error) {
            console.error('Error deleting the PDF file', error);
          }
        }); // Delete the file after sending it
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

async function getUniqueAssets(plates) {
  const uniqueAssets = new Map();

  // Assume plates have a list of assets with relevant details
  plates.forEach(plate => {
    console.log("plate.list");
    console.log(plate.list);
    plate.list.forEach(item => {
      if (!uniqueAssets.has(item?.child_config_id)) {
        uniqueAssets.set(item?.child_config_id, {
          MaterialName: item?.child_name,
          supplier_id: item?.supplier_id,
          Quantity: item?.qty
        });
      } else {
        // If asset is already in the Map, just update the quantity
        let existingItem = uniqueAssets.get(item?.child_config_id);
        existingItem.Quantity += Number(item?.qty); // Convert to Number before adding
      }
    });
  });
  // Convert the Map values to an array
  return Array.from(uniqueAssets.values());
}

GeneralCalculationRouter.post(
  "/searchfuncByConfigId",
  // verifyAdminToken,
  async (req, res) => {
  const { configId } = req.body;
  const data = await getStaticData(); // Use the renamed function


  const result = data.find(variable => variable.config_id === configId);
  if (result) {
      res.json({
          status: true,
          data: result,
          message: "Successfully fetched"
      });
  } else {
      res.json({
          status: false,
          message: "No variable found with the specified config_id"
      });
  }
});

GeneralCalculationRouter.delete(
  "/DeleteGeneralCalculation/:id",
  verifyAdminToken,
  async (req, res) => {
    const { id } = req.params;
    try {
      const result = await GeneralvariableScheme.findByIdAndDelete(id);
      // res.send(result)
      if (result) {
        const allVariables = await GeneralvariableScheme.find();

        res.send(sendResponse(true, allVariables, " deleted successfully"));
      } else {
        res.status(404).send({ success: false, message: "Data not found" });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  }
);

// Not needed this route for now..
GeneralCalculationRouter.put(
  "/updatecalculation/:id",
  verifyAdminToken,
  async (req, res) => {
    let id = req.params.id;
    let result = await Addvariable.findById(id);
    const { MaterialName, ConfigId, value, TestResult } = req.body;

    try {
      if (!result) {
        res.status(404).send(sendResponse(false, null, "Data not found"));
      } else {
        let update = {};
        if (
          "MaterialName" in req.body &&
          "ConfigId" in req.body &&
          "value" in req.body &&
          "TestResult" in req.body
        ) {
          update = {
            MaterialName,
            ConfigId,
            value,
            TestResult,
          };
        } else {
          res
            .status(400)
            .send(
              sendResponse(false, null, "Invalid keys in the request body")
            );
          return;
        }

        let calculation = await Addvariable.findByIdAndUpdate(id, update, {
          new: true,
        });

        if (calculation) {
          res
            .status(200)
            .send(
              sendResponse(true, calculation, "Plates Updated Successfully")
            );
        } else {
          res.status(400).send(sendResponse(false, null, "Update Failed"));
        }
      }
    } catch (e) {
      console.error(e);
      return res
        .status(500)
        .send(sendResponse(false, null, "Internal Server Error"));
    }
  }
);
export default GeneralCalculationRouter;
