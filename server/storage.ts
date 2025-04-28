import { translations, type Translation, type InsertTranslation } from "@shared/schema";
import { db } from "./db";
import { desc, eq } from "drizzle-orm";

export interface IStorage {
  getTranslations(limit?: number): Promise<Translation[]>;
  addTranslation(translation: InsertTranslation): Promise<Translation>;
}

export class DatabaseStorage implements IStorage {
  async getTranslations(limit = 10): Promise<Translation[]> {
    return db.select()
      .from(translations)
      .orderBy(desc(translations.timestamp))
      .limit(limit);
  }

  async addTranslation(insertTranslation: InsertTranslation): Promise<Translation> {
    const [translation] = await db
      .insert(translations)
      .values(insertTranslation)
      .returning();
    
    return translation;
  }
}

export const storage = new DatabaseStorage();
