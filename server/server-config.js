/**
 * Server Configuration for Things 3 MCP Integration
 * 
 * This module contains server configuration constants and utilities.
 */

export const SERVER_CONFIG = {
  name: "things-dxt",
  version: "1.3.0",
  capabilities: {
    tools: {},
  },
  jxa: {
    timeout: 30000,
    maxBuffer: 256 * 1024, // 256KB max buffer - sufficient for typical JXA output
  },
  validation: {
    maxStringLength: 2000,        // Maximum length for string inputs (doubled from default)
    maxArrayLength: 100,          // Maximum number of items in arrays (tags, todos, etc.)
    maxRequestSize: 32 * 1024,    // Maximum total request size (32KB)
    maxNotesLength: 10000,        // Maximum length for notes field
    maxScriptSize: 100 * 1024,    // Maximum generated JXA script size (100KB)
  },
};

export const ERROR_MESSAGES = {
  THINGS_NOT_RUNNING: "Things 3 is not running. Please launch Things 3 and try again.",
  JXA_TIMEOUT: "JXA execution timed out",
  JXA_FAILED: "Failed to execute JXA",
  THINGS_CHECK_FAILED: "Failed to check if Things 3 is running",
  TODO_NOT_FOUND: "TODO_NOT_FOUND",
  PROJECT_NOT_FOUND: "PROJECT_NOT_FOUND",
  ITEM_NOT_FOUND: "ITEM_NOT_FOUND",
};

export const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
};

export const THINGS_LIST_IDS = {
  INBOX: 'TMInboxListSource',
  TODAY: 'TMTodayListSource',
  UPCOMING: 'TMUpcomingListSource',
  ANYTIME: 'TMAnytimeListSource',
  SOMEDAY: 'TMSomedayListSource',
  LOGBOOK: 'TMLogbookListSource',
  TRASH: 'TMTrashListSource',
};