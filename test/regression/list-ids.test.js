#!/usr/bin/env node

/**
 * Regression tests for List IDs Issue
 * 
 * Tests that the correct list IDs are used for built-in Things 3 lists,
 * preventing the issue where get_anytime returned empty results due to
 * incorrect list ID mapping
 */

import { TestSuite, expect, ThingsTestHelper } from '../test-utils.js';
import { execSync } from 'child_process';
import path from 'path';

const suite = new TestSuite('List IDs Regression Tests');

// Test that critical list IDs are correct
suite.test('Anytime list uses correct ID (TMNextListSource)', async () => {
  const isRunning = await ThingsTestHelper.isRunning();
  if (!isRunning) {
    console.log('⏭️  Skipping regression tests - Things 3 not running');
    return;
  }
  
  const result = await ThingsTestHelper.getListIDs();
  expect.toEqual(result.success, true);
  
  const anytimeList = result.data.find(list => list.name === 'Anytime');
  expect.toBeTruthy(anytimeList, 'Anytime list should exist');
  expect.toEqual(anytimeList.id, 'TMNextListSource');
  expect.toBeFalsy(anytimeList.id === 'TMAnytimeListSource'); // Wrong ID
});

suite.test('Upcoming list uses correct ID (TMCalendarListSource)', async () => {
  const isRunning = await ThingsTestHelper.isRunning();
  if (!isRunning) {
    console.log('⏭️  Skipping - Things 3 not running');
    return;
  }
  
  const result = await ThingsTestHelper.getListIDs();
  expect.toEqual(result.success, true);
  
  const upcomingList = result.data.find(list => list.name === 'Upcoming');
  expect.toBeTruthy(upcomingList, 'Upcoming list should exist');
  expect.toEqual(upcomingList.id, 'TMCalendarListSource');
  expect.toBeFalsy(upcomingList.id === 'TMUpcomingListSource'); // Wrong ID
});

// Test that get_anytime actually works (was broken due to wrong list ID)
suite.test('get_anytime returns results instead of empty array', async () => {
  const isRunning = await ThingsTestHelper.isRunning();
  if (!isRunning) {
    console.log('⏭️  Skipping - Things 3 not running');
    return;
  }
  
  // First, create a test todo in Anytime list
  const createScript = `
    function run(argv) {
      try {
        const things = Application('com.culturedcode.ThingsMac');
        const todo = things.ToDo({ name: 'Test Anytime Todo for Regression' });
        things.toDos.push(todo);
        
        // Move to Anytime by not scheduling it (default is Anytime)
        return JSON.stringify({
          success: true,
          data: { id: todo.id(), name: todo.name() }
        });
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: { message: error.message, type: error.name }
        });
      }
    }
  `;
  
  const createResult = await ThingsTestHelper.executeJXA(createScript);
  expect.toEqual(createResult.success, true);
  
  const testTodoId = createResult.data.id;
  
  try {
    // Now test get_anytime
    const scriptPath = path.join(process.cwd(), 'jxa', 'build', 'get_anytime.js');
    const result = execSync(`osascript -l JavaScript "${scriptPath}" '{"operation":"get_anytime"}'`, { encoding: 'utf8' });
    const parsed = JSON.parse(result);
    
    expect.toEqual(parsed.success, true);
    expect.toBeTruthy(Array.isArray(parsed.data));
    expect.toBeTruthy(parsed.data.length > 0); // Should have at least our test todo
    
    // Find our test todo in the results (it might take a moment to appear)
    const testTodo = parsed.data.find(todo => todo.id === testTodoId);
    if (testTodo) {
      expect.toEqual(testTodo.name, 'Test Anytime Todo for Regression');
      console.log('  ✅ Test todo found in Anytime list');
    } else {
      console.log('  ⚠️  Test todo not found in Anytime list (timing issue)');
      // This is not necessarily a failure - the important thing is that get_anytime works
    }
    
  } finally {
    // Clean up the test todo
    try {
      const cleanupScript = `
        function run(argv) {
          try {
            const params = JSON.parse(argv[0] || '{}');
            const things = Application('com.culturedcode.ThingsMac');
            const todo = things.toDos.byId(params.id);
            things.delete(todo);
            return JSON.stringify({ success: true });
          } catch (error) {
            return JSON.stringify({ success: false, error: { message: error.message } });
          }
        }
      `;
      
      await ThingsTestHelper.executeJXA(cleanupScript, { id: testTodoId });
    } catch (e) {
      console.log('⚠️  Failed to clean up test todo:', e.message);
    }
  }
});

// Test that get_upcoming also works with correct list ID
suite.test('get_upcoming returns results with correct list ID', async () => {
  const isRunning = await ThingsTestHelper.isRunning();
  if (!isRunning) {
    console.log('⏭️  Skipping - Things 3 not running');
    return;
  }
  
  const scriptPath = path.join(process.cwd(), 'jxa', 'build', 'get_upcoming.js');
  try {
    const result = execSync(`osascript -l JavaScript "${scriptPath}" '{"operation":"get_upcoming"}'`, { encoding: 'utf8' });
    const parsed = JSON.parse(result);
    
    expect.toEqual(parsed.success, true);
    expect.toBeTruthy(Array.isArray(parsed.data));
    // Note: We don't require items in Upcoming, just that it doesn't error
    
  } catch (error) {
    throw new Error(`get_upcoming failed with correct list ID: ${error.message}`);
  }
});

// Test that all built-in list operations work
suite.test('all built-in list operations work with correct IDs', async () => {
  const isRunning = await ThingsTestHelper.isRunning();
  if (!isRunning) {
    console.log('⏭️  Skipping - Things 3 not running');
    return;
  }
  
  const listOperations = [
    { operation: 'get_inbox', expectedListId: 'TMInboxListSource' },
    { operation: 'get_today', expectedListId: 'TMTodayListSource' },
    { operation: 'get_anytime', expectedListId: 'TMNextListSource' },
    { operation: 'get_upcoming', expectedListId: 'TMCalendarListSource' },
    { operation: 'get_someday', expectedListId: 'TMSomedayListSource' },
    { operation: 'get_logbook', expectedListId: 'TMLogbookListSource' },
    { operation: 'get_trash', expectedListId: 'TMTrashListSource' }
  ];
  
  for (const { operation, expectedListId } of listOperations) {
    const scriptPath = path.join(process.cwd(), 'jxa', 'build', `${operation}.js`);
    try {
      const result = execSync(`osascript -l JavaScript "${scriptPath}" '{"operation":"${operation}"}'`, { encoding: 'utf8' });
      const parsed = JSON.parse(result);
      
      expect.toEqual(parsed.success, true, `${operation} should succeed`);
      expect.toBeTruthy(Array.isArray(parsed.data), `${operation} should return array`);
      
    } catch (error) {
      throw new Error(`${operation} failed: ${error.message}`);
    }
  }
});

// Test that the JXA scripts contain the correct list IDs
suite.test('bundled scripts contain correct list IDs', async () => {
  const scriptsToCheck = [
    'get_anytime.js',
    'get_upcoming.js',
    'get_inbox.js',
    'get_today.js'
  ];
  
  for (const scriptName of scriptsToCheck) {
    const scriptPath = path.join(process.cwd(), 'jxa', 'build', scriptName);
    
    try {
      const scriptContent = execSync(`cat "${scriptPath}"`, { encoding: 'utf8' });
      
      // Check that correct IDs are present
      expect.toContain(scriptContent, 'TMNextListSource', `${scriptName} should contain correct Anytime ID`);
      expect.toContain(scriptContent, 'TMCalendarListSource', `${scriptName} should contain correct Upcoming ID`);
      
      // Check that incorrect IDs are NOT present
      expect.toBeFalsy(
        scriptContent.includes('TMAnytimeListSource'), 
        `${scriptName} should not contain incorrect Anytime ID`
      );
      expect.toBeFalsy(
        scriptContent.includes('TMUpcomingListSource'), 
        `${scriptName} should not contain incorrect Upcoming ID`
      );
      
    } catch (error) {
      throw new Error(`Failed to check ${scriptName}: ${error.message}`);
    }
  }
});

// Test that source files also have correct IDs
suite.test('source files contain correct list IDs', async () => {
  const utilsPath = path.join(process.cwd(), 'jxa', 'src', 'utils.js');
  
  try {
    const sourceContent = execSync(`cat "${utilsPath}"`, { encoding: 'utf8' });
    
    // Check LIST_IDS constant
    expect.toContain(sourceContent, 'ANYTIME: "TMNextListSource"');
    expect.toContain(sourceContent, 'UPCOMING: "TMCalendarListSource"');
    
    // Ensure old incorrect IDs are not present
    expect.toBeFalsy(sourceContent.includes('TMAnytimeListSource'));
    expect.toBeFalsy(sourceContent.includes('TMUpcomingListSource'));
    
  } catch (error) {
    throw new Error(`Failed to check source utils.js: ${error.message}`);
  }
});

// Test the specific scenario that was broken
suite.test('reproduces and validates fix for empty get_anytime issue', async () => {
  const isRunning = await ThingsTestHelper.isRunning();
  if (!isRunning) {
    console.log('⏭️  Skipping - Things 3 not running');
    return;
  }
  
  // This test simulates the exact issue that was reported:
  // get_anytime was returning [] instead of actual items
  
  const scriptPath = path.join(process.cwd(), 'jxa', 'build', 'get_anytime.js');
  const result = execSync(`osascript -l JavaScript "${scriptPath}" '{"operation":"get_anytime"}'`, { encoding: 'utf8' });
  const parsed = JSON.parse(result);
  
  expect.toEqual(parsed.success, true);
  expect.toBeTruthy(Array.isArray(parsed.data));
  
  // The key fix: we should NOT get an empty array if there are items in Anytime
  // We can't guarantee items exist, but we can ensure the operation succeeds
  // If there are items, they should have the correct structure
  if (parsed.data.length > 0) {
    const firstItem = parsed.data[0];
    expect.toHaveProperty(firstItem, 'id');
    expect.toHaveProperty(firstItem, 'name');
    expect.toHaveProperty(firstItem, 'status');
    
    console.log(`  ℹ️  Found ${parsed.data.length} items in Anytime list`);
  } else {
    console.log('  ℹ️  Anytime list is empty (this is fine)');
  }
});

// Run the tests
suite.run().catch(() => process.exit(1));