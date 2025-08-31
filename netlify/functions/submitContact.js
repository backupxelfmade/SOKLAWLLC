const fetch = require("node-fetch");

exports.handler = async (event) => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: false, error: "No form data provided" }),
      };
    }

    const formData = JSON.parse(event.body);

    const MONDAY_API_KEY = process.env.MONDAY_API_KEY;
    const BOARD_ID = process.env.MONDAY_BOARD_ID;

    if (!MONDAY_API_KEY || !BOARD_ID) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          success: false,
          error: "Missing Monday.com API credentials",
        }),
      };
    }

    const query = `
      mutation ($boardId: ID!, $itemName: String!, $columnValues: JSON!) {
        create_item(board_id: $boardId, item_name: $itemName, column_values: $columnValues) {
          id
        }
      }
    `;

    const variables = {
      boardId: BOARD_ID,
      itemName: formData.name || "New Contact",
      columnValues: JSON.stringify({
        email: { email: formData.email, text: formData.email },
        text: formData.message,
      }),
    };

    const response = await fetch("https://api.monday.com/v2", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: MONDAY_API_KEY,
      },
      body: JSON.stringify({ query, variables }),
    });

    const result = await response.json();

    if (result.errors) {
      console.error("Monday API error:", result.errors);
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: false, error: result.errors[0].message }),
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: true,
        message: "Message sent to Monday.com",
        mondayId: result.data.create_item.id,
      }),
    };
  } catch (err) {
    console.error("Function error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: false, error: err.message }),
    };
  }
};
