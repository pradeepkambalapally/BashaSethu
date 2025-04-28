import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTranslationSchema, translationResponseSchema } from "@shared/schema";
import axios from "axios";

// Translation function using LibreTranslate API
async function translateText(text: string): Promise<{
  teluguText: string;
  englishText: string;
}> {
  try {
    // LibreTranslate public API endpoint
    const LIBRE_TRANSLATE_API = "https://libretranslate.com/translate";
    
    // For English translation
    const englishResponse = await axios.post(LIBRE_TRANSLATE_API, {
      q: text,
      source: "auto", // Auto-detect source language
      target: "en", // English
      format: "text",
      api_key: "" // Public API may have limits, can be empty for now
    });
    
    // Note: LibreTranslate doesn't support Telugu directly
    // We'll use a message explaining this limitation
    
    return {
      // Since LibreTranslate doesn't support Telugu, we include a note
      teluguText: `${text} (Telugu translation unavailable - LibreTranslate doesn't support Telugu)`,
      englishText: englishResponse.data.translatedText
    };
    
  } catch (error) {
    console.error('Translation API error:', error);
    // Fallback in case of API error
    return { 
      teluguText: `${text} (Translation service unavailable)`, 
      englishText: `${text} (Translation service unavailable)` 
    };
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // API Routes
  app.post("/api/translate", async (req, res) => {
    try {
      const { banjaraText } = req.body;
      
      if (!banjaraText) {
        return res.status(400).json({ message: "Banjara text is required" });
      }
      
      // Translate the text
      const { teluguText, englishText } = await translateText(banjaraText);
      
      // Create a translation record
      const translationData = {
        banjaraText,
        teluguText,
        englishText
      };
      
      // Validate with schema
      const validatedData = insertTranslationSchema.parse(translationData);
      
      // Store the translation
      const savedTranslation = await storage.addTranslation(validatedData);
      
      // Return the translation
      const response = translationResponseSchema.parse({
        banjaraText: savedTranslation.banjaraText,
        teluguText: savedTranslation.teluguText,
        englishText: savedTranslation.englishText
      });
      
      return res.status(200).json(response);
    } catch (error) {
      console.error("Translation error:", error);
      return res.status(500).json({ 
        message: "Failed to translate text",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  app.get("/api/translations", async (_req, res) => {
    try {
      const translations = await storage.getTranslations();
      return res.status(200).json(translations);
    } catch (error) {
      console.error("Failed to fetch translations:", error);
      return res.status(500).json({ 
        message: "Failed to fetch translations",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
