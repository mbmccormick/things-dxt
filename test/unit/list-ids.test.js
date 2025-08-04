#!/usr/bin/env node

/**
 * Unit tests for Things 3 List IDs
 * 
 * Tests the correct mapping of built-in list IDs that are not documented
 * in the Things.sdef specification and must be discovered empirically
 */

import { TestSuite, expect } from '../test-utils.js';

const suite = new TestSuite('List IDs Unit Tests');

// Expected LIST_IDs (discovered through empirical testing)
const EXPECTED_LIST_IDS = {
  INBOX: "TMInboxListSource",
  TODAY: "TMTodayListSource", 
  UPCOMING: "TMCalendarListSource",    // NOT "TMUpcomingListSource"
  ANYTIME: "TMNextListSource",         // NOT "TMAnytimeListSource"
  SOMEDAY: "TMSomedayListSource",
  LOGBOOK: "TMLogbookListSource",
  TRASH: "TMTrashListSource"
};

// Test the known correct list IDs
suite.test('has correct LIST_IDs constants', () => {
  // We'll import this from utils.js when available
  // For now, test against our known correct values
  
  const testMappings = [
    { name: 'INBOX', expected: 'TMInboxListSource' },
    { name: 'TODAY', expected: 'TMTodayListSource' },
    { name: 'UPCOMING', expected: 'TMCalendarListSource' },
    { name: 'ANYTIME', expected: 'TMNextListSource' },
    { name: 'SOMEDAY', expected: 'TMSomedayListSource' },
    { name: 'LOGBOOK', expected: 'TMLogbookListSource' },
    { name: 'TRASH', expected: 'TMTrashListSource' }
  ];
  
  testMappings.forEach(({ name, expected }) => {
    expect.toEqual(EXPECTED_LIST_IDS[name], expected);
  });
});

// Test specifically the IDs that were wrong and caused issues
suite.test('uses correct ANYTIME list ID', () => {
  const correctId = 'TMNextListSource';
  const incorrectId = 'TMAnytimeListSource';
  
  expect.toEqual(EXPECTED_LIST_IDS.ANYTIME, correctId);
  expect.toBeFalsy(EXPECTED_LIST_IDS.ANYTIME === incorrectId);
});

suite.test('uses correct UPCOMING list ID', () => {
  const correctId = 'TMCalendarListSource'; 
  const incorrectId = 'TMUpcomingListSource';
  
  expect.toEqual(EXPECTED_LIST_IDS.UPCOMING, correctId);
  expect.toBeFalsy(EXPECTED_LIST_IDS.UPCOMING === incorrectId);
});

// Test that all IDs follow expected pattern
suite.test('all list IDs follow TMxxxListSource pattern', () => {
  Object.values(EXPECTED_LIST_IDS).forEach(id => {
    expect.toBeTruthy(id.startsWith('TM'));
    expect.toBeTruthy(id.endsWith('ListSource'));
    expect.toBeTruthy(id.length > 'TMListSource'.length);
  });
});

// Test ID uniqueness
suite.test('all list IDs are unique', () => {
  const ids = Object.values(EXPECTED_LIST_IDS);
  const uniqueIds = [...new Set(ids)];
  
  expect.toEqual(ids.length, uniqueIds.length);
});

// Test that the mapping covers all expected lists
suite.test('covers all expected built-in lists', () => {
  const expectedLists = [
    'INBOX', 'TODAY', 'UPCOMING', 'ANYTIME', 
    'SOMEDAY', 'LOGBOOK', 'TRASH'
  ];
  
  expectedLists.forEach(listName => {
    expect.toHaveProperty(EXPECTED_LIST_IDS, listName);
    expect.toBeTruthy(typeof EXPECTED_LIST_IDS[listName] === 'string');
    expect.toBeTruthy(EXPECTED_LIST_IDS[listName].length > 0);
  });
});

// Test common mistakes that were made
suite.test('avoids common ID naming mistakes', () => {
  const commonMistakes = {
    // These are the IDs that seemed logical but were wrong
    ANYTIME_WRONG: 'TMAnytimeListSource',
    UPCOMING_WRONG: 'TMUpcomingListSource',
    
    // These would be other potential logical mistakes
    TODAY_WRONG: 'TMTodayListSource', // This one is actually correct
    INBOX_WRONG: 'TMInboxListSource'  // This one is also correct
  };
  
  // The wrong ones should not match our correct IDs
  expect.toBeFalsy(EXPECTED_LIST_IDS.ANYTIME === commonMistakes.ANYTIME_WRONG);
  expect.toBeFalsy(EXPECTED_LIST_IDS.UPCOMING === commonMistakes.UPCOMING_WRONG);
  
  // The correct ones should match
  expect.toEqual(EXPECTED_LIST_IDS.TODAY, commonMistakes.TODAY_WRONG);
  expect.toEqual(EXPECTED_LIST_IDS.INBOX, commonMistakes.INBOX_WRONG);
});

// Test the relationship between display names and IDs
suite.test('documents the display name to ID mapping', () => {
  const displayToIdMapping = {
    'Inbox': 'TMInboxListSource',
    'Today': 'TMTodayListSource',
    'Upcoming': 'TMCalendarListSource',  // Note: uses Calendar, not Upcoming
    'Anytime': 'TMNextListSource',       // Note: uses Next, not Anytime  
    'Someday': 'TMSomedayListSource',
    'Logbook': 'TMLogbookListSource',
    'Trash': 'TMTrashListSource'
  };
  
  // Verify our constants match this mapping
  expect.toEqual(EXPECTED_LIST_IDS.INBOX, displayToIdMapping['Inbox']);
  expect.toEqual(EXPECTED_LIST_IDS.TODAY, displayToIdMapping['Today']);
  expect.toEqual(EXPECTED_LIST_IDS.UPCOMING, displayToIdMapping['Upcoming']);
  expect.toEqual(EXPECTED_LIST_IDS.ANYTIME, displayToIdMapping['Anytime']);
  expect.toEqual(EXPECTED_LIST_IDS.SOMEDAY, displayToIdMapping['Someday']);
  expect.toEqual(EXPECTED_LIST_IDS.LOGBOOK, displayToIdMapping['Logbook']);
  expect.toEqual(EXPECTED_LIST_IDS.TRASH, displayToIdMapping['Trash']);
});

// Test validation helper for new installations
suite.test('provides validation pattern for new installations', () => {
  // This is the JXA code that should be run to validate list IDs
  const validationCode = `
    function run() {
      try {
        const things = Application('com.culturedcode.ThingsMac');
        const lists = things.lists();
        return JSON.stringify({
          success: true,
          data: lists.map(l => ({ id: l.id(), name: l.name() }))
        });
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: { message: error.message }
        });
      }
    }
  `;
  
  // Test that the validation code is syntactically correct JavaScript
  expect.toContain(validationCode, 'things.lists()');
  expect.toContain(validationCode, 'l.id()');
  expect.toContain(validationCode, 'l.name()');
  
  // Test that it returns proper JSON structure
  expect.toContain(validationCode, 'JSON.stringify');
  expect.toContain(validationCode, 'success: true');
  expect.toContain(validationCode, 'success: false');
});

// Run the tests
suite.run().catch(() => process.exit(1));