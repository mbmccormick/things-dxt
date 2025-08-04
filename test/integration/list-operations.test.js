#!/usr/bin/env node

/**
 * Integration tests for List Operations
 * 
 * Tests the actual Things 3 list operations (get_inbox, get_today, get_anytime, etc.)
 * These tests require Things 3 to be running and accessible
 */

import { TestSuite, expect, ThingsTestHelper } from '../test-utils.js';
import { execSync } from 'child_process';
import path from 'path';

const suite = new TestSuite('List Operations Integration Tests');

// Verify Things 3 is running before starting tests
suite.test('Things 3 is running and accessible', async () => {
  const isRunning = await ThingsTestHelper.isRunning();
  expect.toBeTruthy(isRunning, 'Things 3 must be running for integration tests');
});

// Test built-in script execution
suite.test('get_anytime script executes successfully', async () => {
  const scriptPath = path.join(process.cwd(), 'jxa', 'build', 'get_anytime.js');
  
  try {
    // Use osascript with file path directly to avoid shell escaping
    const result = execSync(`osascript -l JavaScript "${scriptPath}" '{"operation":"get_anytime"}'`, { 
      encoding: 'utf8' 
    });
    const parsed = JSON.parse(result);
    
    expect.toHaveProperty(parsed, 'success');
    expect.toEqual(parsed.success, true);
    expect.toHaveProperty(parsed, 'data');
    expect.toBeTruthy(Array.isArray(parsed.data));
  } catch (error) {
    throw new Error(`get_anytime script failed: ${error.message}`);
  }
});

suite.test('get_today script executes successfully', async () => {
  const scriptPath = path.join(process.cwd(), 'jxa', 'build', 'get_today.js');
  try {
    const result = execSync(`osascript -l JavaScript "${scriptPath}" '{"operation":"get_today"}'`, { encoding: 'utf8' });
    const parsed = JSON.parse(result);
    
    expect.toHaveProperty(parsed, 'success');
    expect.toEqual(parsed.success, true);
    expect.toHaveProperty(parsed, 'data');
    expect.toBeTruthy(Array.isArray(parsed.data));
  } catch (error) {
    throw new Error(`get_today script failed: ${error.message}`);
  }
});

suite.test('get_inbox script executes successfully', async () => {
  const scriptPath = path.join(process.cwd(), 'jxa', 'build', 'get_inbox.js');
  try {
    const result = execSync(`osascript -l JavaScript "${scriptPath}" '{"operation":"get_inbox"}'`, { encoding: 'utf8' });
    const parsed = JSON.parse(result);
    
    expect.toHaveProperty(parsed, 'success');
    expect.toEqual(parsed.success, true);
    expect.toHaveProperty(parsed, 'data');
    expect.toBeTruthy(Array.isArray(parsed.data));
  } catch (error) {
    throw new Error(`get_inbox script failed: ${error.message}`);
  }
});

suite.test('get_upcoming script executes successfully', async () => {
  const scriptPath = path.join(process.cwd(), 'jxa', 'build', 'get_upcoming.js');
  try {
    const result = execSync(`osascript -l JavaScript "${scriptPath}" '{"operation":"get_upcoming"}'`, { encoding: 'utf8' });
    const parsed = JSON.parse(result);
    
    expect.toHaveProperty(parsed, 'success');
    expect.toEqual(parsed.success, true);
    expect.toHaveProperty(parsed, 'data');
    expect.toBeTruthy(Array.isArray(parsed.data));
  } catch (error) {
    throw new Error(`get_upcoming script failed: ${error.message}`);
  }
});

suite.test('get_someday script executes successfully', async () => {
  const scriptPath = path.join(process.cwd(), 'jxa', 'build', 'get_someday.js');
  try {
    const result = execSync(`osascript -l JavaScript "${scriptPath}" '{"operation":"get_someday"}'`, { encoding: 'utf8' });
    const parsed = JSON.parse(result);
    
    expect.toHaveProperty(parsed, 'success');
    expect.toEqual(parsed.success, true);
    expect.toHaveProperty(parsed, 'data');
    expect.toBeTruthy(Array.isArray(parsed.data));
  } catch (error) {
    throw new Error(`get_someday script failed: ${error.message}`);
  }
});

// Test that list IDs are correct by verifying against actual Things 3
suite.test('validates correct list IDs with actual Things 3', async () => {
  const result = await ThingsTestHelper.getListIDs();
  
  expect.toEqual(result.success, true);
  expect.toBeTruthy(Array.isArray(result.data));
  
  const listMap = {};
  result.data.forEach(list => {
    listMap[list.name] = list.id;
  });
  
  // Verify the critical IDs that were fixed
  expect.toEqual(listMap['Anytime'], 'TMNextListSource');
  expect.toEqual(listMap['Upcoming'], 'TMCalendarListSource');
  
  // Verify other known IDs
  expect.toEqual(listMap['Inbox'], 'TMInboxListSource');
  expect.toEqual(listMap['Today'], 'TMTodayListSource');
  expect.toEqual(listMap['Someday'], 'TMSomedayListSource');
  expect.toEqual(listMap['Logbook'], 'TMLogbookListSource');
  expect.toEqual(listMap['Trash'], 'TMTrashListSource');
});

// Test that get_anytime actually returns items (if any exist)
suite.test('get_anytime returns valid todo objects', async () => {
  const scriptPath = path.join(process.cwd(), 'jxa', 'build', 'get_anytime.js');
  const result = execSync(`osascript -l JavaScript "${scriptPath}" '{"operation":"get_anytime"}'`, { encoding: 'utf8' });
  const parsed = JSON.parse(result);
  
  expect.toEqual(parsed.success, true);
  
  // If there are any todos in Anytime, validate their structure
  if (parsed.data.length > 0) {
    const todo = parsed.data[0];
    
    // Validate todo structure
    expect.toHaveProperty(todo, 'id');
    expect.toHaveProperty(todo, 'name');
    expect.toHaveProperty(todo, 'status');
    expect.toHaveProperty(todo, 'tagNames');
    expect.toHaveProperty(todo, 'tags');
    
    expect.toBeTruthy(typeof todo.id === 'string');
    expect.toBeTruthy(typeof todo.name === 'string');
    expect.toBeTruthy(['open', 'completed', 'canceled'].includes(todo.status));
    expect.toBeTruthy(typeof todo.tagNames === 'string');
    expect.toBeTruthy(Array.isArray(todo.tags));
  }
});

// Test error handling for invalid operations
suite.test('handles invalid list operations gracefully', async () => {
  const script = `
    function run(argv) {
      try {
        const things = Application('com.culturedcode.ThingsMac');
        // Try to access a non-existent list and actually use it
        const badList = things.lists.byId('NonExistentListID');
        const items = badList.toDos(); // This should throw an error
        return JSON.stringify({ success: true, data: items });
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: { message: error.message, type: error.name }
        });
      }
    }
  `;
  
  const result = await ThingsTestHelper.executeJXA(script);
  
  // Should handle the error gracefully
  expect.toEqual(result.success, false);
  expect.toHaveProperty(result, 'error');
  expect.toHaveProperty(result.error, 'message');
});

// Test that all list operations return consistent data structures
suite.test('all list operations return consistent data structures', async () => {
  const listOperations = [
    'get_inbox',
    'get_today', 
    'get_anytime',
    'get_upcoming',
    'get_someday',
    'get_logbook',
    'get_trash'
  ];
  
  for (const operation of listOperations) {
    const scriptPath = path.join(process.cwd(), 'jxa', 'build', `${operation}.js`);
    try {
      const result = execSync(`osascript -l JavaScript "${scriptPath}" '{"operation":"${operation}"}'`, { encoding: 'utf8' });
      const parsed = JSON.parse(result);
      
      expect.toEqual(parsed.success, true, `${operation} should succeed`);
      expect.toBeTruthy(Array.isArray(parsed.data), `${operation} should return array`);
      
      // If there are any items returned, they should have consistent structure
      if (parsed.data.length > 0) {
        const item = parsed.data[0];
        expect.toHaveProperty(item, 'id');
        expect.toHaveProperty(item, 'name');
        expect.toHaveProperty(item, 'status');
      }
    } catch (error) {
      throw new Error(`${operation} failed: ${error.message}`);
    }
  }
});

// Run the tests and cleanup
suite.run()
  .then(() => ThingsTestHelper.cleanup())
  .catch((error) => {
    ThingsTestHelper.cleanup();
    process.exit(1);
  });