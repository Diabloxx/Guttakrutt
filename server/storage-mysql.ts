/**
 * MySQL-specific storage implementation for session handling
 * This module ensures no PostgreSQL-specific code is executed in a MySQL context
 */

import session from "express-session";
import memorystore from "memorystore";
import { DatabaseStorage } from './DatabaseStorage';
import { storage } from './storage';

// Create memory store for sessions
const MemoryStore = memorystore(session);

/**
 * Helper function to initialize a MySQL-compatible session store
 * This ensures we don't load or use any PostgreSQL-specific code
 * that could cause conflicts with MySQL.
 * 
 * @returns A configured session store compatible with MySQL
 */
export function createMySqlSessionStore(): session.Store {
  // When using MySQL, use memory store for session data
  console.log('Creating memory session store for MySQL');
  return new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  });
}

/**
 * Check if we're running in MySQL mode and need to use the MySQL-specific session store
 * 
 * @returns True if DB_TYPE is 'mysql', false otherwise
 */
export function isMySqlMode(): boolean {
  return process.env.DB_TYPE === 'mysql';
}

/**
 * Get the database storage instance with MySQL-compatible session store
 * This should be used instead of importing storage directly in MySQL mode
 * 
 * @returns The database storage instance
 */
export function getMySqlStorage(): typeof storage {
  return storage;
}