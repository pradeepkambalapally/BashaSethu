import { pgTable, text, serial, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const translations = pgTable("translations", {
  id: serial("id").primaryKey(),
  banjaraText: text("banjara_text").notNull(),
  teluguText: text("telugu_text").notNull(),
  englishText: text("english_text").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertTranslationSchema = createInsertSchema(translations).omit({
  id: true,
  timestamp: true,
});

export type InsertTranslation = z.infer<typeof insertTranslationSchema>;
export type Translation = typeof translations.$inferSelect;

// Translation API response schema
export const translationResponseSchema = z.object({
  banjaraText: z.string(),
  teluguText: z.string(),
  englishText: z.string(),
});

export type TranslationResponse = z.infer<typeof translationResponseSchema>;
