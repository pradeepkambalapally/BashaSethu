import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTranslationSchema, translationResponseSchema } from "@shared/schema";
import axios from "axios";

// Translation function using a combination of translation services
async function translateText(text: string): Promise<{
  teluguText: string;
  englishText: string;
}> {
  try {
    console.log(`Translating Banjara text: "${text}"`);
    
    // For English translation using LibreTranslate
    const englishResponse = await axios.post("https://libretranslate.de/translate", {
      q: text,
      source: "auto", // Auto-detect source language
      target: "en",   // English
      format: "text"
    });
    
    // For Telugu translation - using a different approach since LibreTranslate doesn't support Telugu
    // First translate to Hindi as an intermediary
    const hindiResponse = await axios.post("https://libretranslate.de/translate", {
      q: text,
      source: "auto", // Auto-detect source language
      target: "hi",   // Hindi
      format: "text"
    });
    
    // Since we can't directly get Telugu, we'll use a predefined mapping for common Banjara phrases
    // This is a simplified approach for demo purposes
    const banjaraToTeluguMap: Record<string, string> = {
      "namaskar": "నమస్కారం", // Hello/Greetings in Telugu
      "dhanyavad": "ధన్యవాదాలు", // Thank you in Telugu
      "gor laga": "నమస్కారం", // Respectful greeting in Telugu
      "kem cho": "ఎలా ఉన్నారు", // How are you in Telugu
      "ha": "అవును", // Yes in Telugu
      "nahi": "కాదు", // No in Telugu
      "accha": "మంచిది", // Good in Telugu
      "thik hai": "సరే", // Okay in Telugu
      "call do": "కాల్ చేయండి", // Call in Telugu
    };
    
    // Check if the text includes any of our mapped phrases
    let teluguText = "";
    const lowerText = text.toLowerCase().trim();
    
    // Try to find matches in our map
    for (const [banjaraPhrase, teluguTranslation] of Object.entries(banjaraToTeluguMap)) {
      if (lowerText.includes(banjaraPhrase.toLowerCase())) {
        teluguText = teluguTranslation;
        break;
      }
    }
    
    // If no match found, use Hindi as closest approximation
    if (!teluguText) {
      teluguText = hindiResponse.data.translatedText + " (హిందీలో)";
    }
    
    console.log(`Translation results - English: "${englishResponse.data.translatedText}", Telugu: "${teluguText}"`);
    
    return {
      teluguText: teluguText,
      englishText: englishResponse.data.translatedText
    };
    
  } catch (error) {
    console.error('Translation API error:', error);
    // Fallback in case of API error
    return { 
      teluguText: `${text} (అనువాదం అందుబాటులో లేదు)`, // "Translation unavailable" in Telugu
      englishText: `${text} (Translation unavailable)` 
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
