import "./env.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is missing. Add it to your environment.");
}

const gemini = new GoogleGenerativeAI(apiKey);

export const getGeminiModel = (model = "gemini-1.5-pro") =>
  gemini.getGenerativeModel({ model });

export default gemini;
