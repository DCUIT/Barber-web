import { getSQLiteDB } from '../services/sqlite.js';

export const DB_DRIVER = (process.env.DB_DRIVER || 'mongo').toLowerCase();

export function getDB() {
  if (DB_DRIVER === 'sqlite') {
    return getSQLiteDB();
  }
  // Mongo driver is default; routes will import mongoose models directly.
  return null;
}

