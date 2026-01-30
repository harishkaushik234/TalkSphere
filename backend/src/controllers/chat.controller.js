import { generateStreamToken } from "../lib/stream.js";

export async function getStreamToken(req, res) {
  try {
    const token = generateStreamToken(req.user.id);

    res.status(200).json({ token });
  } catch (error) {
    console.log("Error in getStreamToken controller:", error.message);
    // Provide more specific error message
    const errorMessage = error.message.includes("not initialized")
      ? "Stream service is not properly configured. Please check your environment variables."
      : "Internal Server Error";
    res.status(500).json({ message: errorMessage });
  }
}
