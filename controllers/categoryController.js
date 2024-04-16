import slugify from "slugify"
import colors from "colors"
import categoryModel from "../models/categoryModel.js"
import fs from "fs"

//create category
export const createCategoryController = async (req, res) => {
  try {
    const { name } = req.fields
    const { image, bannerImage } = req.files

    //validate
    if (!name) {
      return res.status(401).json({
        message: "Name is required",
      })
    }
    if (!image) {
      return res.status(401).json({
        message: "Banner Image is required",
      })
    }
    if (image && image.size > 1000000) {
      return res
        .status(500)
        .send({ error: "Image is required and should be less then 1 mb" })
    }
    if (bannerImage && bannerImage.size > 10000000) {
      return res.status(500).send({
        error: "Banner Image is required and should be less then 10 mb",
      })
    }

    //existing
    const existingCategory = await categoryModel.findOne({ name })
    if (existingCategory) {
      return res.status(500).json({
        success: false,
        message: "Category exists",
      })
    }

    //new category
    const category = await new categoryModel({
      name,
    })

    if (image) {
      category.image.data = fs.readFileSync(image.path)
      category.image.contentType = image.type
    }

    if (bannerImage) {
      category.bannerImage.data = fs.readFileSync(bannerImage.path)
      category.bannerImage.contentType = bannerImage.type
    }
    await category.save()
    return res.status(201).json({
      success: true,
      message: "New category created",
      category,
    })
  } catch (err) {
    console.error(colors.bgRed.white(`${err}`))
    res.status(500).json({
      success: false,
      message: "Error in Create Category",
      err,
    })
  }
}

// update category
export const updateCategoryController = async (req, res) => {
  try {
    const { name } = req.fields
    const { id } = req.params
    const { image, bannerImage } = req.files // Add this line

    // Check if image is provided
    if (image && image.size > 1000000) {
      return res.status(500).send({
        error: "Image is required and should be less than 1 mb",
      })
    }
    if (bannerImage && bannerImage.size > 10000000) {
      return res.status(500).send({
        error: "Banner Image is required and should be less then 10 mb",
      })
    }

    let category = await categoryModel.findById(id)

    // Update only if the category exists
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      })
    }

    // Update name
    category.name = name

    // Update image if provided
    if (image) {
      category.image.data = fs.readFileSync(image.path)
      category.image.contentType = image.type
    }
    if (bannerImage) {
      category.bannerImage.data = fs.readFileSync(bannerImage.path)
      category.bannerImage.contentType = bannerImage.type
    }

    // Save changes
    category = await category.save()

    return res.status(201).json({
      success: true,
      message: "Category Updated Successfully",
      category,
    })
  } catch (err) {
    console.error(colors.bgRed.white(`${err}`))
    res.status(500).json({
      success: false,
      message: "Error in Update Category",
      err,
    })
  }
}

// get all category
export const categoryController = async (req, res) => {
  try {
    const categories = await categoryModel.find()

    return res.status(201).json({
      success: true,
      message: "All Categories",
      count: categories.length,
      categories: categories,
    })
  } catch (err) {
    console.error(colors.bgRed.white(`${err}`))
    res.status(500).json({
      success: false,
      message: "Error in getting all Categories",
      err,
    })
  }
}

// get single  all category
export const singleCategoryController = async (req, res) => {
  try {
    const { id } = req.params
    const category = await categoryModel
      .findOne({ _id: id })
      .populate("products")

    // validation
    if (!category) {
      return res.status(401).json({
        success: true,
        message: "Category not found",
      })
    }

    return res.status(201).json({
      success: true,
      message: "Get single category successfully.",
      category,
    })
  } catch (err) {
    console.error(colors.bgRed.white(`${err}`))
    res.status(500).json({
      success: false,
      message: "Error in getting single category",
      err,
    })
  }
}

//dselete category
export const deleteCategoryController = async (req, res) => {
  try {
    const { id } = req.params

    const category = await categoryModel.findById(id)

    // validation
    if (!category) {
      return res.status(401).json({
        success: false,
        message: "Category not exist",
      })
    }
    console.log("Category", category?.products?.length)
    if (category?.products?.length >= 1) {
      console.log("Have Products")
      return res.status(500).json({
        success: true,
        message: "Category have products. Can't be Deleted.",
      })
    }
    if (category) {
      await categoryModel.findByIdAndDelete(id)
      return res.status(201).json({
        success: true,
        message: "Category Deleted.",
      })
    }
  } catch (err) {
    console.error(colors.bgRed.white(`${err}`))
    res.status(500).json({
      success: false,
      message: "Error in deleting single category",
      err,
    })
  }
}
