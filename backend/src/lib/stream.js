import { StreamChat } from "stream-chat";
import "dotenv/config";

const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;

if (!apiKey || !apiSecret) {
  console.error("Stream API key or Secret is missing");
  console.error("Please set STREAM_API_KEY and STREAM_API_SECRET in your .env file");
}

// Only create client if API keys are available
let streamClient = null;
if (apiKey && apiSecret) {
  try {
    streamClient = StreamChat.getInstance(apiKey, apiSecret);
  } catch (error) {
    console.error("Error initializing Stream client:", error);
  }
}

export const upsertStreamUser = async (userData) => {
  if (!streamClient) {
    console.warn("Stream client not initialized, skipping user upsert");
    return userData;
  }
  try {
    // Filter out base64 images (too large for Stream API, causes timeout)
    // Stream API has limits on user data size
    const streamUserData = { ...userData };
    if (streamUserData.image && streamUserData.image.startsWith("data:image")) {
      // Base64 images are too large, use empty string or skip image update
      streamUserData.image = "";
    }
    
    await streamClient.upsertUsers([streamUserData]);
    return userData;
  } catch (error) {
    console.error("Error upserting Stream user:", error.message);
    return userData; // Return userData even if Stream update fails
  }
};

export const generateStreamToken = (userId) => {
  if (!streamClient) {
    throw new Error("Stream client not initialized. Please check STREAM_API_KEY and STREAM_API_SECRET in .env");
  }
  try {
    // ensure userId is a string
    const userIdStr = userId.toString();
    const token = streamClient.createToken(userIdStr);
    if (!token) {
      throw new Error("Failed to generate Stream token");
    }
    return token;
  } catch (error) {
    console.error("Error generating Stream token:", error);
    throw error; // Re-throw so controller can handle it
  }
};
