# 🦸‍♂️ Comics AI Description Generator

An Appwrite Cloud Function that automatically generates engaging descriptions for your comic books using Google's Gemini AI and real-time search data! 🚀

## 🎯 Features

- 🤖 Uses Gemini AI for creative and contextual descriptions
- 🔍 Incorporates real-world information through Google Search
- ⚡ Quick and concise descriptions (under 250 characters)
- 📚 Works with any comic book title

## 🛠️ Setup

### Prerequisites

- 🔑 Google Gemini API Key
- 🔎 Google Custom Search API Key
- 🆔 Google Custom Search Engine ID
- ☁️ Appwrite Account

### Environment Variables

Set these in your Appwrite Console under Functions > comics_ai_description > Variables:

```bash
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_SEARCH_API_KEY=your_search_api_key
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id
```

## 🚀 Usage

The function expects a JSON payload with the following structure:

```json
{
  "title": "Comic Title",
}
```

### Response Format

```json
{
  "success": true,
  "description": "Generated description for your comic"
}
```

## 🔄 Integration

This function can be triggered:

- 📝 On document creation in comics collection
- 🔄 On document update in comics collection
- 🌐 Via HTTP request

## 📋 Example

Input:

```json
{
  "title": "Batman: Year One",
}
```

Output:

```json
{
  "success": true,
  "description": "Frank Miller's groundbreaking origin story redefines Batman's first year as Gotham's guardian. A gritty, noir masterpiece that shaped the Dark Knight's legend."
}
```

## ⚠️ Error Handling

The function includes robust error handling for:

- 🔒 Missing API keys
- 📡 Failed search requests
- 🤖 AI generation issues
- 📄 Invalid input data

## 🤝 Contributing

Feel free to contribute to this project! Open issues and pull requests are welcome. 🎉
