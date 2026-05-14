import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let db;

export function getSQLiteDB() {
  if (db) return db;

  const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'data.sqlite');
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  // schema (MVP)
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user','barber','admin'))
    );


    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      durationMinutes INTEGER NOT NULL,
      description TEXT DEFAULT '',
      image TEXT DEFAULT '',
      category TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS barbers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      avatar TEXT DEFAULT '',
      experienceYears INTEGER DEFAULT 0,
      specialty TEXT DEFAULT '',
      workingHours TEXT DEFAULT '{}',
      rating REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      barberId INTEGER NOT NULL,
      serviceId INTEGER NOT NULL,
      bookingDate TEXT NOT NULL,
      bookingTime TEXT NOT NULL,
      note TEXT DEFAULT '',
      status TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_bookings_barber_date_time ON bookings(barberId, bookingDate, bookingTime);
  `);

  return db;
}

