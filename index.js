// Import required packages
const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");

module.exports = async function ({ req, res, log, error: logError }) {
  // Retrieve secrets and configuration from environment variables
  const apiKey = process.env.GEMINI_API_KEY;
  const searchApiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
  const modelName = process.env.GEMINI_MODEL || "gemini-pro";

  if (!apiKey || !searchApiKey || !searchEngineId) {
    logError("FATAL: Required environment variables not set.");
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
    // Search for comic information
    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${searchApiKey}&cx=${searchEngineId}&q=${encodeURIComponent(
      title + " comic book"
    )}`;
    const searchResponse = await axios.get(searchUrl);
    const searchResults = searchResponse.data.items || [];

    // Extract relevant information from search results
    const searchInfo = searchResults.slice(0, 3).map((item) => ({
      title: item.title,
      snippet: item.snippet,
    }));

    log("Search results found: " + JSON.stringify(searchInfo));

    // Initialize Gemini AI with the API key
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    // Create an enhanced prompt with search results
    const searchContext = searchInfo
      .map((info) => `${info.title}\n${info.snippet}`)
      .join("\n\n");

    const prompt = `Generate a brief, engaging description (under 1000 characters) for a comic book.
    Use the following real information about the comic if relevant:
    
    ${searchContext}
    
    Comic Details:
    Title: ${title}
    Status: ${status}
    ${rating > 0 ? `Rating: ${rating}/5` : ""}
    
    Create an informative and appealing description that combines the search information with creative writing.
    Focus on being interesting and inviting while maintaining accuracy.`;

    log(`Generating description with enhanced context for: "${title}"`);
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
    logError(`Error generating description for "${title}": ${errorMessage}`);
    return res.json({
      success: false,
      error: "Failed to generate description.",
    });
  }
};
