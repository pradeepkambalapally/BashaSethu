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
    
    // Set a short timeout to prevent long waiting times
    const axiosConfig = {
      timeout: 3000 // 3 seconds timeout
    };
    
    // Initialize variables to hold API responses
    let englishApiTranslation = "";
    
    try {
      // For English translation using LibreTranslate with a fast timeout
      const englishResponse = await axios.post("https://libretranslate.de/translate", {
        q: text,
        source: "auto", // Auto-detect source language
        target: "en",   // English
        format: "text"
      }, axiosConfig);
      
      englishApiTranslation = englishResponse.data.translatedText;
    } catch (error) {
      const apiError = error as Error;
      console.log("English translation API timeout/error - using dictionary only:", apiError.message);
      englishApiTranslation = text; // Fall back to original text
    }
    
    // Comprehensive Banjara-Telugu-English dictionary with accurate translations
    // This represents a small subset of Banjara vocabulary as a starting point
    const banjaraDictionary: Record<string, { telugu: string, english: string }> = {
      // Greetings and common phrases
      "namaskar": { telugu: "నమస్కారం", english: "Hello" },
      "dhanyavad": { telugu: "ధన్యవాదాలు", english: "Thank you" },
      "gor laga": { telugu: "నమస్కారం", english: "Respectful greetings" },
      "kem cho": { telugu: "ఎలా ఉన్నారు", english: "How are you" },
      
      // Common responses
      "ha": { telugu: "అవును", english: "Yes" },
      "nahi": { telugu: "కాదు", english: "No" },
      "accha": { telugu: "మంచిది", english: "Good" },
      "thik hai": { telugu: "సరే", english: "Okay" },
      
      // Actions
      "call do": { telugu: "కాల్ చేయండి", english: "Make a call" },
      "jao": { telugu: "వెళ్ళండి", english: "Go" },
      "aao": { telugu: "రండి", english: "Come" },
      "khana": { telugu: "భోజనం", english: "Food" },
      "pani": { telugu: "నీరు", english: "Water" },
      
      // Family terms
      "bai": { telugu: "సోదరి", english: "Sister" },
      "bhai": { telugu: "సోదరుడు", english: "Brother" },
      "amma": { telugu: "అమ్మ", english: "Mother" },
      "baba": { telugu: "నాన్న", english: "Father" },
      "dada": { telugu: "తాత", english: "Grandfather" },
      "dadi": { telugu: "అమ్మమ్మ", english: "Grandmother" },
      
      // Time and directions
      "subah": { telugu: "ఉదయం", english: "Morning" },
      "dopahar": { telugu: "మధ్యాహ్నం", english: "Afternoon" },
      "shaam": { telugu: "సాయంత్రం", english: "Evening" },
      "raat": { telugu: "రాత్రి", english: "Night" },
      "aaj": { telugu: "నేడు", english: "Today" },
      "kal": { telugu: "రేపు", english: "Tomorrow" },
      
      // Numbers
      "ek": { telugu: "ఒకటి", english: "One" },
      "do": { telugu: "రెండు", english: "Two" },
      "teen": { telugu: "మూడు", english: "Three" },
      "char": { telugu: "నాలుగు", english: "Four" },
      "paanch": { telugu: "ఐదు", english: "Five" },
      
      // Colors
      "laal": { telugu: "ఎరుపు", english: "Red" },
      "neela": { telugu: "నీలం", english: "Blue" },
      "hara": { telugu: "ఆకుపచ్చ", english: "Green" },
      "peela": { telugu: "పసుపు", english: "Yellow" },
      "kaala": { telugu: "నలుపు", english: "Black" },
      
      // Animals
      "kutra": { telugu: "కుక్క", english: "Dog" },
      "billi": { telugu: "పిల్లి", english: "Cat" },
      "ghoda": { telugu: "గుర్రం", english: "Horse" },
      "gaay": { telugu: "ఆవు", english: "Cow" },
      "bakri": { telugu: "మేక", english: "Goat" },
    };
    
    // Check for exact matches or word fragments in our dictionary
    let matchedTranslations = [];
    const words = text.toLowerCase().split(/\s+/);
    
    // Try to find matches for each word
    for (const word of words) {
      let matched = false;
      
      // Check for exact matches first
      if (banjaraDictionary[word]) {
        matchedTranslations.push({
          original: word,
          translation: banjaraDictionary[word]
        });
        matched = true;
        continue;
      }
      
      // If no exact match, check for partial matches
      for (const [banjaraWord, translation] of Object.entries(banjaraDictionary)) {
        if (word.includes(banjaraWord) || banjaraWord.includes(word)) {
          matchedTranslations.push({
            original: word,
            translation: translation
          });
          matched = true;
          break;
        }
      }
      
      // If no match found, leave as is
      if (!matched) {
        matchedTranslations.push({
          original: word,
          translation: null
        });
      }
    }
    
    // Construct translations from matched parts
    let teluguParts = [];
    let englishParts = [];
    
    // If we have at least one match, build a composite translation
    // Otherwise use the full LibreTranslate response
    if (matchedTranslations.some(match => match.translation !== null)) {
      for (const match of matchedTranslations) {
        if (match.translation) {
          teluguParts.push(match.translation.telugu);
          englishParts.push(match.translation.english);
        } else {
          // For words without a translation, keep the original
          teluguParts.push(match.original);
          // But don't duplicate the English translation
        }
      }
    } else {
      // If no matches in our dictionary, use the API translation if available
      // or fallback to the original text
      englishParts = [englishApiTranslation || text];
      
      // For Telugu we need to indicate that it's machine-translated
      // Since LibreTranslate doesn't support Telugu, we're using transliteration
      teluguParts = [`${text} (తెలుగులో ఉచిత అనువాదం లేదు)`]; // "No free translation in Telugu"
    }
    
    const teluguText = teluguParts.join(' ');
    const englishText = englishParts.join(' ');
    
    console.log(`Translation results - English: "${englishText}", Telugu: "${teluguText}"`);
    
    return {
      teluguText: teluguText,
      englishText: englishText
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
  
  // Text-to-Speech proxy for Telugu
  app.get("/api/tts", async (req, res) => {
    try {
      const { text, lang } = req.query;
      
      if (!text) {
        return res.status(400).json({ message: "Text parameter is required" });
      }
      
      const language = lang || 'te';
      
      // Get the TTS URL from Google
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text as string)}&tl=${language}&client=tw-ob`;
      
      console.log(`Fetching TTS for "${text}" in language "${language}"`);
      
      try {
        // Fetch the audio file
        const response = await axios({
          method: 'GET',
          url: ttsUrl,
          responseType: 'stream',
          timeout: 5000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
          }
        });
        
        // Set appropriate headers
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for a day
        
        // Pipe the audio stream directly to the response
        response.data.pipe(res);
      } catch (error) {
        console.error("TTS API Error:", error);
        return res.status(500).json({ 
          message: "Failed to fetch text-to-speech audio",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    } catch (error) {
      console.error("TTS Server Error:", error);
      return res.status(500).json({ 
        message: "Server error in text-to-speech endpoint",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
