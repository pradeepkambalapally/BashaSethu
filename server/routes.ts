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
      "yadi": { telugu: "అమ్మా", english: "Mom" },
      "baba": { telugu: "నాన్న", english: "Father" },
      "dada": { telugu: "తాత", english: "Grandfather" },
      "dadi": { telugu: "అమ్మమ్మ", english: "Grandmother" },
      "beti": { telugu: "కుతురు", english: "Daughter" },
      
      // Time and directions
      "subah": { telugu: "ఉదయం", english: "Morning" },
      "dopahar": { telugu: "మధ్యాహ్నం", english: "Afternoon" },
      "shaam": { telugu: "సాయంత్రం", english: "Evening" },
      "raat": { telugu: "రాత్రి", english: "Night" },
      "aaj": { telugu: "నేడు", english: "Today" },
      "kal": { telugu: "రేపు", english: "Tomorrow" },
      "aram ka": { telugu: "ఎలా ఉన్నారు", english: "How are you" },
      
      // Numbers
      "ek": { telugu: "ఒకటి", english: "One" },
      "do": { telugu: "రెండు", english: "Two" },
      "teen": { telugu: "మూడు", english: "Three" },
      "char": { telugu: "నాలుగు", english: "Four" },
      "paanch": { telugu: "ఐదు", english: "Five" },
      "kam": { telugu: "థక్కువ", english: "Less" },
      
      // Colors
      "laal": { telugu: "ఎరుపు", english: "Red" },
      "neela": { telugu: "నీలం", english: "Blue" },
      "hara": { telugu: "ఆకుపచ్చ", english: "Green" },
      "peela": { telugu: "పసుపు", english: "Yellow" },
      "kaala": { telugu: "నలుపు", english: "Black" },
      "sono": { telugu: "బంగారం", english: "Gold" },
      
      // Animals
      "kutra": { telugu: "కుక్క", english: "Dog" },
      "billi": { telugu: "పిల్లి", english: "Cat" },
      "ghoda": { telugu: "గుర్రం", english: "Horse" },
      "gaay": { telugu: "ఆవు", english: "Cow" },
      "bakri": { telugu: "మేక", english: "Goat" },
      "suri": { telugu: "అడ పంది", english: "Pig/Sow" },
      
      // Elements
      "angar": { telugu: "నిప్పు", english: "Fire" },
      
      // Food and ingredients
      "inda": { telugu: "గుడ్డు", english: "Egg" },
      "guddu": { telugu: "గుడ్డు", english: "Egg" },
      "bedra": { telugu: "తమాత", english: "Tomato" },
      "amba": { telugu: "మామిడి కాయ", english: "Mango" },
      "sitaphal": { telugu: "సీతాఫలం", english: "Custard Apple" },
      "dana": { telugu: "గింజ", english: "Grain" },
      
      // Household and places
      "ghar": { telugu: "నిలయం", english: "House" },
      "davakhana": { telugu: "ఆసుపత్రి", english: "Hospital" },
      
      // Actions and verbs
      "khaldo": { telugu: "తిన్నా", english: "Ate" },
      "thinna": { telugu: "తిన్నా", english: "Ate" },
      "jomat": { telugu: "వెళ్లకు", english: "Don't go" },
      "katchi": { telugu: "ఎక్కడ ఉన్నావ్", english: "Where are" },
      "kevdi jaro": { telugu: "ఎక్కడికి వెళ్తున్నావ్", english: "Where are you going" },
      "sogo": { telugu: "నిద్ర పోయ", english: "Slept" },
      "katalo": { telugu: "విసుగు", english: "Bore" },
      
      // Others
      "kida": { telugu: "పురుగు", english: "Insect" },
      "sota": { telugu: "రోకలి", english: "Pestle" },
      "navvo": { telugu: "కొత్తది", english: "New" },
    };
    
    // Check for exact matches or word fragments in our dictionary
    let matchedTranslations = [];
    const words = text.toLowerCase().split(/\s+/);
    
    // Try to find matches for each word
    for (const word of words) {
      let matched = false;
      
      // Remove punctuation for matching
      const cleanWordLower = word.toLowerCase().replace(/[^\w\s]/g, '');
      
      // Check for exact matches first (case-insensitive)
      if (banjaraDictionary[cleanWordLower]) {
        matchedTranslations.push({
          original: word,
          translation: banjaraDictionary[cleanWordLower]
        });
        matched = true;
        continue;
      }
      
      // Phonetic similarity helper function
      // Scores how similar two words sound (simplified version)
      const getPhoneticSimilarity = (word1: string, word2: string): number => {
        // If lengths are very different, they likely sound different
        if (Math.abs(word1.length - word2.length) > 2) {
          return 0.2;
        }
        
        // Convert to lowercase
        word1 = word1.toLowerCase();
        word2 = word2.toLowerCase();
        
        // Count matching consonants (more important for sound)
        const consonants = 'bcdfghjklmnpqrstvwxyz';
        let consonantMatches = 0;
        let totalConsonants = 0;
        
        for (let i = 0; i < word1.length; i++) {
          if (consonants.includes(word1[i])) {
            totalConsonants++;
            if (i < word2.length && word1[i] === word2[i]) {
              consonantMatches++;
            }
          }
        }
        
        // Calculate similarity as percentage of matching consonants (0.0 to 1.0)
        return totalConsonants > 0 ? consonantMatches / totalConsonants : 0.3;
      };
      
      // If no exact match, check for partial matches but be more precise
      const partialMatches = [];
      
      for (const [banjaraWord, translation] of Object.entries(banjaraDictionary)) {
        // Add each potential match with its score
        
        // Special case for "khaldo", "kaldo", etc. - should match the "ate" translation
        if ((cleanWordLower === "kaldo" || cleanWordLower === "caldo") && 
             (banjaraWord === "khaldo" || banjaraWord === "thinna")) {
          partialMatches.push({ 
            word: banjaraWord, 
            translation,
            score: 0.95
          });
        }
        else if (cleanWordLower === banjaraWord) {
          // Exact match (highest priority)
          partialMatches.push({ 
            word: banjaraWord, 
            translation,
            score: 1.0
          });
        } 
        else if (getPhoneticSimilarity(cleanWordLower, banjaraWord) > 0.7) {
          // High phonetic similarity
          partialMatches.push({ 
            word: banjaraWord, 
            translation,
            score: 0.9 * getPhoneticSimilarity(cleanWordLower, banjaraWord)
          });
        }
        else if (cleanWordLower.startsWith(banjaraWord + ' ') || cleanWordLower.endsWith(' ' + banjaraWord)) {
          // Word boundary match (high priority)
          partialMatches.push({ 
            word: banjaraWord, 
            translation,
            score: 0.85
          });
        } 
        else if (cleanWordLower === banjaraWord.substring(0, cleanWordLower.length)) {
          // Prefix match (medium priority)
          partialMatches.push({ 
            word: banjaraWord, 
            translation,
            score: 0.7
          });
        } 
        else if (cleanWordLower.length >= 4 && banjaraWord.length >= 4 && 
                   (cleanWordLower.includes(banjaraWord) || banjaraWord.includes(cleanWordLower))) {
          // Substring match for longer words only (low priority)
          // Only consider substring matches for words of 4+ characters
          partialMatches.push({ 
            word: banjaraWord, 
            translation,
            score: 0.5
          });
        }
      }
      
      // Sort matches by score and pick the best one
      if (partialMatches.length > 0) {
        partialMatches.sort((a, b) => b.score - a.score);
        
        matchedTranslations.push({
          original: word,
          translation: partialMatches[0].translation
        });
        matched = true;
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
