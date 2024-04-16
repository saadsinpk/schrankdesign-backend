import slugify from "slugify";
import colors from "colors";
import productModel from "../models/productModel.js";
import fs from "fs";
import categoryModel from "../models/categoryModel.js";
import stripe from "stripe";
import userModel from "../models/userModel.js";
import orderModel from "../models/orderModel.js";

//create product
export const createProductController = async (req, res) => {
  try {
    const {
      name,
      subtitle,
      category,
      rating,
      minDimension,
      maxDimension,
      price,
    } = req.fields;
    const { defaultImage, hoverImage } = req.files;

    //validation
    switch (true) {
      case !name:
        return res.status(500).send({ message: "Name is required" });
      case !subtitle:
        return res.status(500).send({ message: "Subtitle is required" });
      case !price:
        return res.status(500).send({ message: "Price is required" });
      case !category:
        return res.status(500).send({ message: "Category is required" });
      case !rating:
        return res.status(500).send({ message: "Rating is required" });
      case !minDimension:
        return res.status(500).send({ message: "Min Dimension is required" });
      case !maxDimension:
        return res.status(500).send({ message: "Max Dimension is required" });
      case defaultImage && defaultImage.size > 1000000:
        return res.status(500).send({
          error: "Default Image is required and should be less then 1 mb",
        });
      case hoverImage && hoverImage.size > 1000000:
        return res.status(500).send({
          error: "Default Image is required and should be less then 1 mb",
        });
    }

    if (rating > 5) {
      return res.status(500).send({
        message: "Rating stars should be in between 1 - 5",
      });
    }

    const existingCategory = await categoryModel.findById(category);
    if (!existingCategory) {
      return res.status(500).send({
        error: "No Category Found.",
      });
    }
    const products = new productModel({ ...req.fields });
    if (defaultImage) {
      products.defaultImage.data = fs.readFileSync(defaultImage.path);
      products.defaultImage.contentType = defaultImage.type;
    }
    if (hoverImage) {
      products.hoverImage.data = fs.readFileSync(hoverImage.path);
      products.hoverImage.contentType = hoverImage.type;
    }
    await products.save();
    existingCategory.products.push(products);
    await existingCategory.save();
    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      products,
    });
    // ---------------------
  } catch (err) {
    console.error(colors.bgRed.white(`${err}`));
    res.status(500).json({
      success: false,
      message: "Error in product create",
      err,
    });
  }
};

//create checkout session
export const productsCheckoutsession = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log("req user id", req.user._id);
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY; // Replace with your Stripe secret key
    const stripeClient = stripe(stripeSecretKey);
    const { products, address } = req.fields; // Assuming your product data is sent in the request
    const newProducts = JSON.parse(products);
    const newAddress = JSON.parse(address);

    // Create line items for the checkout session
    const lineItems = newProducts.map((product) => ({
      price_data: {
        currency: "eur",
        product_data: {
          name: product.name,
          images: [product.imageUrl], // Add the product image URL here
        },
        unit_amount: product.price * 100, // Convert price to cents
      },
      quantity: 1,
    }));

    //removing image length less than 500 charachters
    const sanitizedProducts = newProducts.map((item) => ({
      id: item.id,
      name: item.name,
      subtitle: item.subtitle,
      rating: item.rating,
      minDimension: item.minDimension,
      maxDimension: item.maxDimension,
      price: item.price,
    }));

    // Convert sanitized products array to JSON string for metadata
    const sanitizedProductsString = JSON.stringify(sanitizedProducts);
    const formattedAddress = JSON.stringify(newAddress);

    // Create a Checkout Session
    const session = await stripeClient.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${process.env.FRONTEND_URL}/dashboard/user/orders/success`,
      cancel_url: `${process.env.FRONTEND_URL}/dashboard/user/orders/failed`,
      metadata: {
        products: sanitizedProductsString, // Pass product details as metadata
        userId: userId,
        address: formattedAddress,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Checkout session created successfully",
      sessionId: session.id,
    });
  } catch (err) {
    console.error(colors.bgRed.white(`${err}`));
    res.status(500).json({
      success: false,
      message: "Error in creating checkout session",
      err,
    });
  }
};

export const stripeWebhookController = async (req, res) => {
  try {
    const event = req.body;

    switch (event.type) {
      case "charge.succeeded":
        // Handle charge succeeded event
        break;

      case "payment_intent.succeeded":
        // Handle payment intent succeeded event
        break;

      case "checkout.session.completed":
        const checkoutSession = event.data.object;
        const products = JSON.parse(checkoutSession.metadata.products);
        const userId = checkoutSession.metadata.userId; // No need to parse userId
        const address = JSON.parse(checkoutSession.metadata.address);

        const totalAmount = products.reduce((total, product) => {
          return total + product.price;
        }, 0);
        console.log("New Order Created");
        const order = new orderModel({
          user: userId,
          products: products.map((product) => ({
            product: product.id,
            quantity: 1, // You might want to add quantity in your product data
          })),
          totalAmount: totalAmount,
          deliveryAddress: address?.deliveryAddress,
          billingAddress: address?.billingAddress,
        });

        await order.save();

        // Use await with findByIdAndUpdate for asynchronous operation
        const user = await userModel.findByIdAndUpdate(userId, {
          $push: { orders: order._id },
        });
        break;

      case "payment_intent.created":
        // Handle payment intent created event
        break;

      // ... handle other event types

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Return a response to acknowledge receipt of the event
    return res.json({ received: true });
  } catch (err) {
    console.error("Error verifying webhook signature:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
};

// get all products
export const getProductController = async (req, res) => {
  try {
    const products = await productModel
      .find({})
      .populate("category")
      .select("-photo")
      .limit(12)
      .sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      message: "All Products",
      count: products.length,
      products,
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
