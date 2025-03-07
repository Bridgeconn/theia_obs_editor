// utils/obsIndexedDB.ts
import Dexie from "dexie";

interface Section {
  id: number;
  imageUrl: string | undefined;
  text: string;
}

interface Content {
  title: string;
  sections: Section[];
  footnotes: string;
}

//Define the structure of our history records
export interface ObsHistoryRecord {
  key: string;
  storyNum: string;
  language: string;
  lastEdited: Date;
  createdAt: Date;
  content: Content;
}

// Create the database instance
const db = new Dexie('obsEditorDB');

// Define the schema
db.version(1).stores({
  obsTranslations: 'key, storyNum, language, lastEdited, createdAt'
});

// Type declaration for our table
interface ObsEditorDatabase extends Dexie {
  obsTranslations: Dexie.Table<ObsHistoryRecord, string>;
}

// Add type information to our db instance
const typedDb = db as ObsEditorDatabase;

let changeTimer: NodeJS.Timeout | null = null;

// Generate a key from storyNum and language
const generateKey = (storyNum: string, language: string): string => {
  return `${language}_${storyNum}`;
};

// Add or update a record
export const saveContent = async (storyNum: string, language: string, content: Content): Promise<void> => {
  const key = generateKey(storyNum, language);
  const now = new Date();
  
  try {
    const existingRecord = await typedDb.obsTranslations.get(key);
    
    if (existingRecord) {
      // Update existing record
      await typedDb.obsTranslations.update(key, {
        content,
        lastEdited: now
      });
    } else {
      // Create new record
      await typedDb.obsTranslations.add({
        key,
        storyNum,
        language,
        content,
        lastEdited: now,
        createdAt: now
      });
    }
  } catch (error) {
    console.error('Failed to save content to IndexedDB:', error);
    throw error;
  }
};

// Schedule content save with 3 second interval
export const scheduleContentSave = (storyNum: string, language: string, content: Content): void => {
  if (changeTimer) {
    clearTimeout(changeTimer);
  }
  
  changeTimer = setTimeout(() => {
    saveContent(storyNum, language, content)
      .catch(error => console.error('Failed to save content to IndexedDB:', error));
  }, 3000);
};

// Get a record by key
export const getContent = async (storyNum: string, language: string): Promise<ObsHistoryRecord | null> => {
  const key = generateKey(storyNum, language);
  
  try {
    const record = await typedDb.obsTranslations.get(key);
    return record || null;
  } catch (error) {
    console.error('Failed to get content from IndexedDB:', error);
    throw error;
  }
};

// Get all records
export const getAllRecords = async (): Promise<ObsHistoryRecord[]> => {
  try {
    return await typedDb.obsTranslations.toArray();
  } catch (error) {
    console.error('Failed to get records from IndexedDB:', error);
    throw error;
  }
};

// Clear all records
export const clearAllRecords = async (): Promise<void> => {
  try {
    await typedDb.obsTranslations.clear();
  } catch (error) {
    console.error('Failed to clear records from IndexedDB:', error);
    throw error;
  }
};

const obsIndexedDBService = {
  saveContent,
  scheduleContentSave,
  getContent,
  getAllRecords,
  clearAllRecords
};

export default obsIndexedDBService;