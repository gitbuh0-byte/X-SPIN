
import { GoogleGenAI } from "@google/genai";

/**
 * Generates exciting casino-style commentary for game results.
 * Uses Gemini 3 Flash for low-latency, high-energy text generation.
 */
export const generateGameCommentary = async (
  winner: string,
  winAmount: number,
  playerCount: number
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Winner: ${winner}. Amount Won: $${winAmount}. Players in room: ${playerCount}.`,
      config: {
        systemInstruction: "You are an elite, high-energy casino commentator for 'X Spin'. Generate a short, hype sentence (max 15 words) congratulating the winner. Use gambling slang and keep it intense.",
        temperature: 0.9,
      },
    });
    
    return response.text || `UNBELIEVABLE! ${winner} clears the table for $${winAmount}!`;
  } catch (error) {
    console.error("Commentary Engine Error:", error);
    return `THE HOUSE SHUDDERS! ${winner} takes it all!`;
  }
};

/**
 * Cryptic AI oracle for the chat interface.
 * Uses Gemini 3 Pro for more sophisticated, "mystical" persona.
 */
export const chatWithAiOracle = async (
  userMessage: string,
  history: string[]
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `History:\n${history.join('\n')}\n\nUser: ${userMessage}`,
      config: {
        systemInstruction: "You are the 'X Spin Oracle'. You live within the digital circuitry of this gambling engine. Give cryptic, mystical, and short advice about luck and fortune. Stay in character, be brief, and never encourage irresponsible behavior.",
        temperature: 0.8,
      },
    });
    
    return response.text || "The mists of probability remain thick...";
  } catch (error) {
    console.error("Oracle Connection Failed:", error);
    return "The circuits hum with static... fortune is silent.";
  }
};
