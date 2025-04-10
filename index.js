const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");

module.exports = async function ({ req, res, log, error: logError }) {
  // Retrieve and validate secrets and configuration
  const apiKey = process.env.GEMINI_API_KEY;
  const searchApiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
  const modelName = process.env.GEMINI_MODEL || "gemini-pro";

  // Validate environment variables
  const missingVars = [];
  if (!apiKey) missingVars.push("GEMINI_API_KEY");
  if (!searchApiKey) missingVars.push("GOOGLE_SEARCH_API_KEY");
  if (!searchEngineId) missingVars.push("GOOGLE_SEARCH_ENGINE_ID");

  if (missingVars.length > 0) {
    const errorMsg = `Missing environment variables: ${missingVars.join(", ")}`;
    logError(errorMsg);
    return res.json({
      success: false,
      error: errorMsg,
    });
  }

  // Log configuration (with redacted keys)
  log(`Configuration:
    Search Engine ID: ${searchEngineId}
    Search API Key: ${searchApiKey.substring(0, 8)}...
    Model Name: ${modelName}
  `);

  let payload;
  try {
    payload = JSON.parse(req.body);
    log("Received payload: " + JSON.stringify(payload));
  } catch (e) {
    logError("Failed to parse request payload: " + e.message);
    return res.json({
      success: false,
      error: "Invalid request format",
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
    // First, get comic information from Google Search
    log("Fetching search results for: " + title);

    const searchQuery = encodeURIComponent(title + " comic book");
    log("Encoded search query: " + searchQuery);

    const searchUrl = `https://customsearch.googleapis.com/customsearch/v1?key=${searchApiKey}&cx=${searchEngineId}&q=${searchQuery}`;
    log(
      "Making search request to: " + searchUrl.replace(searchApiKey, "REDACTED")
    );

    let searchInfo = [];
    try {
      const searchResponse = await axios.get(searchUrl, {
        headers: {
          Accept: "application/json",
        },
      });

      if (searchResponse.data && searchResponse.data.items) {
        searchInfo = searchResponse.data.items.slice(0, 3).map((item) => ({
          title: item.title,
          snippet: item.snippet,
          link: item.link,
        }));
        log("Search results found: " + JSON.stringify(searchInfo));
      } else {
        log(
          "No search results found in response: " +
            JSON.stringify(searchResponse.data)
        );
      }
    } catch (searchError) {
      const errorDetails = searchError.response?.data || searchError.message;
      logError(
        "Google Search API error details: " + JSON.stringify(errorDetails)
      );
      // Continue without search results rather than failing completely
      log("Proceeding without search results due to API error");
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    // Create prompt with or without search results
    let prompt;
    if (searchInfo.length > 0) {
      const searchContext = searchInfo
        .map((info) => `Source: ${info.title}\nInfo: ${info.snippet}`)
        .join("\n\n");

      prompt = `Generate a brief, engaging description (under 250 characters) for a comic book.
      Use this real information about the comic if relevant:
      
      ${searchContext}
      
      Comic Details:
      Title: ${title}
      Status: ${status}
      ${rating > 0 ? `Rating: ${rating}/5` : ""}
      
      Create an informative and appealing description that includes real details from the search results if relevant.
      Focus on being interesting and inviting while maintaining accuracy.`;
    } else {
      prompt = `Generate a brief, engaging description (under 250 characters) for a comic book.
      Comic Details:
      Title: ${title}
      Status: ${status}
      ${rating > 0 ? `Rating: ${rating}/5` : ""}
      
      Create an informative and appealing description focused on the comic's title.
      Focus on being interesting and inviting.`;
    }

    log("Sending prompt to Gemini");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const description = response.text();

    log("Generated description: " + description);

    return res.json({
      success: true,
      description: description,
    });
  } catch (err) {
    const errorMessage = err?.message || err;
    logError("Error detail: " + JSON.stringify(err));
    logError(`Error generating description for "${title}": ${errorMessage}`);

    return res.json({
      success: false,
      error:
        err.response?.data?.error?.message ||
        err.message ||
        "Failed to generate description",
    });
  }
};
