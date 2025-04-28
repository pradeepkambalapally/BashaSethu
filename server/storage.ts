import { translations, type Translation, type InsertTranslation } from "@shared/schema";

export interface IStorage {
  getTranslations(limit?: number): Promise<Translation[]>;
  addTranslation(translation: InsertTranslation): Promise<Translation>;
}

export class MemStorage implements IStorage {
  private translations: Translation[];
  private currentId: number;

  constructor() {
    this.translations = [];
    this.currentId = 1;
  }

  async getTranslations(limit = 10): Promise<Translation[]> {
    return this.translations
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  async addTranslation(insertTranslation: InsertTranslation): Promise<Translation> {
    const id = this.currentId++;
    const timestamp = new Date();
    const translation: Translation = { ...insertTranslation, id, timestamp };
    this.translations.push(translation);
    return translation;
  }
}

export const storage = new MemStorage();
