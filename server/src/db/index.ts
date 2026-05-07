import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../database.sqlite');
let db: Database;

export async function initDb() {
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      userId TEXT,
      title TEXT,
      lastUpdated DATETIME,
      FOREIGN KEY(userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversationId TEXT,
      role TEXT,
      content TEXT,
      signals TEXT,
      estimatedSize INTEGER,
      timestamp DATETIME,
      FOREIGN KEY(conversationId) REFERENCES conversations(id)
    );

    CREATE TABLE IF NOT EXISTS taxonomy (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT,
      field TEXT,
      value TEXT,
      description TEXT,
      parent TEXT
    );
  `);

  // Seed taxonomy if empty
  const count = await db.get('SELECT COUNT(*) as count FROM taxonomy');
  if (count.count === 0) {
    await seedTaxonomy();
  }

  return db;
}

async function seedTaxonomy() {
  console.log('Seeding taxonomy...');
  const dataDir = path.join(__dirname, '../../../data');
  
  // 1. CG Data Dictionary
  const cgData = JSON.parse(fs.readFileSync(path.join(dataDir, 'cg_data_dictionary.json'), 'utf8'));
  const cgValues = JSON.parse(fs.readFileSync(path.join(dataDir, 'cg_field_values.json'), 'utf8'));
  
  for (const item of cgData) {
    const fieldName = item['Field Name'];
    const fieldDesc = item['Field Description'];
    
    // Find human readable values for this field
    const values = cgValues.filter((v: any) => v['Field Name'] === fieldName);
    
    if (values.length > 0) {
      for (const val of values) {
        await db.run(
          'INSERT INTO taxonomy (type, field, value, description) VALUES (?, ?, ?, ?)',
          ['demographic', fieldName, val['Field Value'], val['Field Value Description']]
        );
      }
    } else {
      // Just insert the field itself if no specific values (like age range)
      await db.run(
          'INSERT INTO taxonomy (type, field, value, description) VALUES (?, ?, ?, ?)',
          ['demographic', fieldName, 'ANY', fieldDesc]
      );
    }
  }

  // 2. Location Taxonomy
  const locData = JSON.parse(fs.readFileSync(path.join(dataDir, 'location_taxonomy.json'), 'utf8'));
  for (const item of locData) {
    if (item.sub_category) {
      await db.run(
        'INSERT INTO taxonomy (type, field, value, description, parent) VALUES (?, ?, ?, ?, ?)',
        ['location', 'category', item.sub_category, item.sub_category.replace(/_/g, ' '), item.top_category]
      );
    }
  }

  // 3. Transaction Taxonomy
  const transData = JSON.parse(fs.readFileSync(path.join(dataDir, 'transaction_taxonomy.json'), 'utf8'));
  for (const item of transData) {
    const value = item['Level 4'] || item['Level 3'] || item['Level 2'] || item['Level 1'];
    const parent = item['Level 3'] || item['Level 2'] || item['Level 1'];
    await db.run(
      'INSERT INTO taxonomy (type, field, value, description, parent) VALUES (?, ?, ?, ?, ?)',
      ['transaction', 'category', value, value, parent]
    );
  }

  console.log('Taxonomy seeding complete.');
}

export function getDb() {
  return db;
}
