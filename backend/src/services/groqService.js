import { Groq } from "groq-sdk";

let groqClient = null;

// Create Groq client only when needed
const getGroqClient = () => {
  if (!groqClient) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is missing in your .env file.");
    }

    groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }

  return groqClient;
};

/**
 * Sends a chat request to Groq API.
 *
 * @param {Array} messages - Array of objects:
 * { role: "system" | "user" | "assistant", content: "..." }
 *
 * @returns {Promise<String>} AI response
 */
export const chatCompletion = async (messages) => {
  try {
    // --------------------------------------------------
    // Validate messages
    // --------------------------------------------------
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error("No messages were provided to Groq.");
    }

    // --------------------------------------------------
    // Keep only recent conversation history
    // This prevents token usage from growing indefinitely.
    // --------------------------------------------------
    let recentMessages = messages.slice(-10);

    // --------------------------------------------------
    // Make sure the system message is preserved
    // --------------------------------------------------
    const systemMessage = messages.find(
      (message) => message?.role === "system"
    );

    if (
      systemMessage &&
      !recentMessages.some((message) => message?.role === "system")
    ) {
      recentMessages = [systemMessage, ...recentMessages];
    }

    // --------------------------------------------------
    // Protect against extremely large messages
    // --------------------------------------------------
    const safeMessages = recentMessages.map((message) => {
      if (!message || typeof message !== "object") {
        return message;
      }

      let content = message.content;

      if (typeof content === "string") {
        // Limit individual message size.
        // This prevents accidental huge prompts.
        const MAX_MESSAGE_LENGTH = 12000;

        if (content.length > MAX_MESSAGE_LENGTH) {
          content =
            content.substring(0, MAX_MESSAGE_LENGTH) +
            "\n\n[Additional context truncated to reduce token usage.]";
        }
      }

      return {
        role: message.role,
        content,
      };
    });

    // --------------------------------------------------
    // Get Groq client
    // --------------------------------------------------
    const groq = getGroqClient();

    // --------------------------------------------------
    // Send request to Groq
    // --------------------------------------------------
    const response = await groq.chat.completions.create({
      model: "groq/compound",
      messages: safeMessages,
      temperature: 0.7,
      max_tokens: 1024,
    });

    // --------------------------------------------------
    // Get AI response
    // --------------------------------------------------
    const aiResponse =
      response?.choices?.[0]?.message?.content || "";

    if (!aiResponse.trim()) {
      throw new Error("Groq returned an empty response.");
    }

    return aiResponse;

  } catch (error) {

    // --------------------------------------------------
    // RATE LIMIT ERROR - 429
    // --------------------------------------------------
    if (error?.status === 429) {
      console.error(
        "\n[Groq] Rate limit reached."
      );

      console.error(
        error?.error?.error?.message ||
        error?.message ||
        "Too many tokens requested."
      );

      throw new Error(
        "AI is temporarily busy. Please wait a few seconds and try again."
      );
    }

    // --------------------------------------------------
    // AUTHENTICATION ERROR - 401
    // --------------------------------------------------
    if (error?.status === 401) {
      console.error(
        "\n[Groq] Authentication failed. Check GROQ_API_KEY."
      );

      throw new Error(
        "AI service authentication failed. Please check the Groq API key."
      );
    }

    // --------------------------------------------------
    // BAD REQUEST - 400
    // --------------------------------------------------
    if (error?.status === 400) {
      console.error(
        "\n[Groq] Bad request:"
      );

      console.error(
        error?.error?.error?.message ||
        error?.message
      );

      throw new Error(
        "The AI request was invalid. Please try again."
      );
    }

    // --------------------------------------------------
    // SERVER ERROR - 500+
    // --------------------------------------------------
    if (error?.status >= 500) {
      console.error(
        "\n[Groq] Server error:"
      );

      console.error(error?.message);

      throw new Error(
        "The AI service is temporarily unavailable. Please try again."
      );
    }

    // --------------------------------------------------
    // UNKNOWN ERROR
    // --------------------------------------------------
    console.error(
      "\n[Groq] API Error:"
    );

    console.error(error);

    throw new Error(
      "Failed to get response from Personal Intelligence."
    );
  }
};
