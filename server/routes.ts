import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTranslationSchema, translationResponseSchema } from "@shared/schema";
import axios from "axios";
import { TranslationServiceClient } from '@google-cloud/translate';

// Translation function using Google Cloud Translation API
async function translateText(text: string): Promise<{
  teluguText: string;
  englishText: string;
}> {
  // If we have the Google Cloud API key
  if (process.env.GOOGLE_CLOUD_API_KEY) {
    try {
      // For Telugu translation
      const teluguResponse = await axios.post('https://translation.googleapis.com/language/translate/v2', {
        q: text,
        // Note: Banjara doesn't have an official code, so using Hindi (hi) as closest approximation
        // In a real implementation, you may need to use a more specific approach for Banjara
        source: 'hi',
        target: 'te', // Telugu language code
        key: process.env.GOOGLE_CLOUD_API_KEY
      });
      
      // For English translation
      const englishResponse = await axios.post('https://translation.googleapis.com/language/translate/v2', {
        q: text,
        source: 'hi', // Approximating Banjara with Hindi
        target: 'en', // English language code
        key: process.env.GOOGLE_CLOUD_API_KEY
      });
      
      return {
        teluguText: teluguResponse.data.data.translations[0].translatedText,
        englishText: englishResponse.data.data.translations[0].translatedText
      };
      
    } catch (error) {
      console.error('Translation API error:', error);
      // Fallback in case of API error
      return { 
        teluguText: `${text} (Translation API error)`, 
        englishText: `${text} (Translation API error)` 
      };
    }
  } else {
    // Fallback when no API key is provided
    console.warn('No Google Cloud API key available. Using fallback translations.');
    return { 
      teluguText: `${text} (Telugu translation - API key needed)`, 
      englishText: `${text} (English translation - API key needed)` 
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
