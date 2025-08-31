import fetch from "node-fetch";

export async function handler(event) {
  try {
    const { formData } = JSON.parse(event.body);

    // Monday.com API config
    const MONDAY_API_URL = "https://api.monday.com/v2";
    const MONDAY_API_TOKEN = process.env.MONDAY_API_TOKEN; // stored in Netlify env vars

    // Build column values
    const columnValues = {};
    if (formData.firstName) columnValues.text = formData.firstName;
    if (formData.lastName) columnValues.text_mkv9gdmd = formData.lastName;
    if (formData.email) columnValues.email = { email: formData.email, text: formData.email };
    if (formData.phone) columnValues.text5 = formData.phone;
    if (formData.legalService) columnValues.dropdown_mkv9sy3b = { labels: [formData.legalService] };
    if (formData.message) columnValues.long_text = formData.message;

    const mutation = `
      mutation {
        create_item (
          board_id: 9924465558,
          item_name: "${formData.firstName} ${formData.lastName} - ${formData.legalService || "Legal Inquiry"}",
          column_values: "${JSON.stringify(columnValues).replace(/"/g, '\\"')}"
        ) {
          id
        }
      }
    `;

    const response = await fetch(MONDAY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": MONDAY_API_TOKEN,
      },
      body: JSON.stringify({ query: mutation }),
    });

    const result = await response.json();
    if (result.errors) {
      throw new Error(result.errors[0].message);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data: result.data }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message }),
    };
  }
}
