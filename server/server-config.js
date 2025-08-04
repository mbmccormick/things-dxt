/**
 * Server configuration constants
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get package.json version dynamically
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));

export const SERVER_CONFIG = {
  name: "things",
  version: packageJson.version,
  capabilities: {
    tools: {},
  },
  jxa: {
    timeout: 30000,
    maxBuffer: 10 * 1024 * 1024, // 10MB
  },
  validation: {
    maxScriptSize: 1024 * 1024, // 1MB
  }
};

export const THINGS_LIST_IDS = {
  INBOX: "TMInboxListSource",
  TODAY: "TMTodayListSource",
  UPCOMING: "TMUpcomingListSource",
  ANYTIME: "TMAnytimeListSource",
  SOMEDAY: "TMSomedayListSource",
  LOGBOOK: "TMLogbookListSource",
  TRASH: "TMTrashListSource"
};

export const ERROR_MESSAGES = {
  JXA_TIMEOUT: "JXA execution timed out",
  THINGS_NOT_RUNNING: "Things 3 is not running. Please start Things 3 and try again."
};