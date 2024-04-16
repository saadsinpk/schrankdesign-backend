import axios from "axios";

const klarnaUsername = "PK164329_328dabc8e5bf";
const klarnaPassword = "e587oUfbcnx1rSvz";

const apiURL = "https://api.playground.klarna.com/";
// const createOrderEndpoint = "checkout/v3/orders"; // Adjust the endpoint according to Klarna documentation

export const initiatePayment = async (req, res) => {
  try {
    const {
      acquiring_channel,
      intent,
      purchase_country,
      purchase_currency,
      locale,
      order_amount,
      order_tax_amount,
      order_lines,
      merchant_urls,
    } = req.body;

    const authHeader = `Basic ${Buffer.from(
      `${klarnaUsername}:${klarnaPassword}`
    ).toString("base64")}`;

    const response = await axios.post(
      `${apiURL}/payments/v1/sessions`,
      {
        acquiring_channel,
        intent,
        purchase_country,
        purchase_currency,
        locale,
        order_amount,
        order_tax_amount,
        order_lines,
        merchant_urls,
      },
      {
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Error initiating payment:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// // Controller for creating Klarna order
// export const CreateOrder = async (req, res) => {
//   console.log("Clicked");

//   try {
//     const authHeader = `Basic ${Buffer.from(
//       `${klarnaCredentials.username}:${klarnaCredentials.password}`
//     ).toString("base64")}`;

//     const headers = {
//       "Content-Type": "application/json",
//       // "Klarna-Partner": "string", // Replace with the actual Klarna partner information
//       Authorization: authHeader,
//     };
//     console.log("Request Body:", req.body);
//     const klarnaResponse = await axios.post(
//       `${klarnaBaseUrl}${createOrderEndpoint}`,
//       req.body,
//       { headers }
//     );

//     res.json(klarnaResponse.data);
//   } catch (error) {
//     console.error(
//       "Error creating Klarna order:",
//       error.response?.data || error.message
//     );
//     res
//       .status(error.response?.status || 500)
//       .json({ error: "Internal Server Error" });
//   }
// };

// export const getCheckoutSnippet = async (req, res) => {
//   try {
//     const orderId = req.params.orderId;

//     const readOrderEndpoint = `${klarnaBaseUrl}/checkout/v3/orders/${orderId}`;

//     const klarnaResponse = await axios.get(readOrderEndpoint, {
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Basic ${Buffer.from(
//           `${klarnaCredentials.username}:${klarnaCredentials.password}`
//         ).toString("base64")}`,
//       },
//     });

//     const klarnaSnippet = klarnaResponse.data.html_snippet;
//     res.send(klarnaSnippet);
//   } catch (error) {
//     console.error("Error getting Klarna snippet:", error.message);
//     res.status(500).send("Internal Server Error");
//   }
// };

// export const readOrder = async (req, res) => {
//   try {
//     const orderId = req.params.orderId;

//     const readOrderEndpoint = `${klarnaBaseUrl}/checkout/v3/orders/${orderId}`;

//     const klarnaResponse = await axios.get(readOrderEndpoint, {
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Basic ${Buffer.from(
//           `${klarnaCredentials.username}:${klarnaCredentials.password}`
//         ).toString("base64")}`,
//       },
//     });

//     res.json(klarnaResponse.data);
//   } catch (error) {
//     console.error("Error reading Klarna order:", error.message);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };

// // Controller for rendering Klarna Confirmation snippet
// export const renderConfirmationPage = async (req, res) => {
//   try {
//     const orderId = req.params.orderId;

//     const readOrderEndpoint = `${klarnaBaseUrl}/checkout/v3/orders/${orderId}`;

//     const klarnaResponse = await axios.get(readOrderEndpoint, {
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Basic ${Buffer.from(
//           `${klarnaCredentials.username}:${klarnaCredentials.password}`
//         ).toString("base64")}`,
//       },
//     });

//     const klarnaSnippet = klarnaResponse.data.html_snippet;

//     // Your confirmation page HTML
//     const confirmationPage = `
//         <html>
//           <body>
//             <!-- Your confirmation page html -->
//             ${klarnaSnippet}
//             <!-- More of your confirmation page html -->
//           </body>
//         </html>
//       `;

//     res.send(confirmationPage);
//   } catch (error) {
//     console.error("Error rendering confirmation page:", error.message);
//     res.status(500).send("Internal Server Error");
//   }
// };
