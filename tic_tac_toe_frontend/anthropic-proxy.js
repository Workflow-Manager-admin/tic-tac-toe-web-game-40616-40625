const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.CHATBOT_PROXY_PORT || 3112;

app.use(cors());
app.use(express.json());

/**
 * Anthropic chat proxy endpoint
 * Receives: { message: string }
 * Returns: { response: string }
 *
 * The API key is stored securely on the server (.env: ANTHROPIC_API_KEY)
 */
app.post("/api/anthropic-chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res
        .status(400)
        .json({ error: "Message parameter is required." });
    }

    // Make request to Anthropic's API (Claude v2, v3, or similar)
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) {
      return res.status(500).json({ error: "Anthropic API key not configured." });
    }

    const data = {
      model: "claude-3-opus-20240229", // You may adjust model as needed
      max_tokens: 128,
      messages: [{ role: "user", content: message }]
    };

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicKey,
        "content-type": "application/json",
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return res.status(502).json({
        error: "Anthropic API error",
        detail: errorBody
      });
    }

    const result = await response.json();
    const modelReply = result?.content?.[0]?.text || "I couldn't find an answer.";

    res.json({ response: modelReply });
  } catch (err) {
    res.status(500).json({ error: "Internal error", detail: String(err) });
  }
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Anthropic proxy server listening on port ${PORT}`);
});
