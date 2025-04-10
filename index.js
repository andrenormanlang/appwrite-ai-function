// Import from @google/generative-ai package
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function ({ req, res, log, error: logError }) {
  // Retrieve secrets and configuration from environment variables
  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || "gemini-pro";

  if (!apiKey) {
    logError("FATAL: GEMINI_API_KEY environment variable not set.");
    return res.json({
      success: false,
      error: "Server configuration error.",
    });
  }

  let payload;
  try {
    payload = JSON.parse(req.body);
    log("Received payload: " + JSON.stringify(payload));
  } catch (e) {
    logError("Failed to parse request payload: " + e.message);
    return res.json({
      success: false,
      error: "Invalid request format.",
    });
  }

  const { title, status, rating } = payload;

  if (!title || !status) {
    logError("Missing required fields: title or status");
    return res.json({
      success: false,
      error: "Missing required fields: title, status.",
    });
  }

  try {
    // Initialize Gemini AI with the API key
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = `Generate a brief, engaging description (under 1000 characters) for a comic book:
    Title: ${title}
    Status: ${status}
    Focus on being interesting and inviting.`;

    log(`Generating description for: "${title}"`);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const description = response.text();
    log(`Generated description successfully: ${description}`);

    return res.json({
      success: true,
      description: description,
    });
  } catch (err) {
    const errorMessage = err?.message || err;
    logError(
      `Error generating description with Gemini for "${title}": ${errorMessage}`
    );
    return res.json({
      success: false,
      error: "Failed to generate description.",
    });
  }
}
