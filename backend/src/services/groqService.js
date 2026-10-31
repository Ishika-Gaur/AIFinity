import { Groq } from "groq-sdk";

let groqClient = null;

export const getGroqClient = () => {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GROQ_API_KEY is not set in environment variables.");
    }
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
};

export const getGroqModel = () => {
  return process.env.GROQ_MODEL || "openai/gpt-oss-120b";
};

/**
 * Robust JSON parser for Groq markdown fences or raw JSON
 */
export const safeParseGroqJSON = (text) => {
  try {
    let cleanText = (text || "").trim();
    if (cleanText.startsWith("```json")) {
      cleanText = cleanText.substring(7);
      if (cleanText.endsWith("```")) {
        cleanText = cleanText.substring(0, cleanText.length - 3);
      }
    } else if (cleanText.startsWith("```")) {
      cleanText = cleanText.substring(3);
      if (cleanText.endsWith("```")) {
        cleanText = cleanText.substring(0, cleanText.length - 3);
      }
    }
    return JSON.parse(cleanText.trim());
  } catch (error) {
    throw new Error("Failed to parse Groq AI JSON response: " + error.message);
  }
};

/**
 * Sends a chat request to Groq API.
 * @param {Array} messages - Array of message objects { role, content }
 * @returns {Promise<String>} - The AI response text
 */
export const chatCompletion = async (messages) => {
  try {
    const groq = getGroqClient();
    const model = getGroqModel();
    const response = await groq.chat.completions.create({
      model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 2048,
    });
    return response.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("Groq API Error:", error.message);
    throw new Error("Failed to get response from Personal Intelligence: " + error.message);
  }
};

/**
 * Executes a completion or JSON structured prompt using Groq with multi-fallback support
 * @param {string} prompt - The user prompt or instructions
 * @param {object|null} schema - Optional schema or JSON requirement
 * @param {boolean} isChat - Whether this is a multi-turn chat
 * @param {Array} history - Chat history if isChat is true
 */
export const callGroq = async (prompt, schema = null, isChat = false, history = []) => {
  const groq = getGroqClient();
  const model = getGroqModel();

  if (isChat) {
    const formattedMessages = history.map((h) => {
      let content = "";
      if (Array.isArray(h.parts)) {
        content = h.parts.map((p) => p.text).join("\n");
      } else if (typeof h.content === "string") {
        content = h.content;
      }
      return {
        role: h.role === "model" ? "assistant" : h.role === "assistant" ? "assistant" : "user",
        content,
      };
    });
    formattedMessages.push({ role: "user", content: prompt });

    const completion = await groq.chat.completions.create({
      model,
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 2048,
    });
    return completion.choices[0]?.message?.content || "";
  }

  const messages = [
    {
      role: "system",
      content: schema
        ? "You are an expert educational AI assistant. You must respond strictly with valid JSON. Do not include markdown codeblocks or text outside the JSON."
        : "You are an expert educational AI assistant.",
    },
    {
      role: "user",
      content: schema
        ? `${prompt}\n\nIMPORTANT: Respond with pure, valid JSON matching the requested structure.`
        : prompt,
    },
  ];

  const params = {
    model,
    messages,
    temperature: schema ? 0.2 : 0.7,
    max_tokens: 3072,
  };

  if (schema) {
    params.response_format = { type: "json_object" };
  }

  const response = await groq.chat.completions.create(params);
  const rawText = response.choices[0]?.message?.content || "";

  if (schema) {
    return safeParseGroqJSON(rawText);
  }
  return rawText;
};
