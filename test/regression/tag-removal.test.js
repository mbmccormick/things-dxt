#!/usr/bin/env node

/**
 * Regression tests for Tag Removal (Issue #3)
 * 
 * Tests that tags can be properly removed from todos using update_todo
 * with an empty array, ensuring the fix for Issue #3 continues to work
 */

import { TestSuite, expect, ThingsTestHelper } from '../test-utils.js';
import { execSync } from 'child_process';
import path from 'path';

const suite = new TestSuite('Tag Removal Regression Tests (Issue #3)');

let testTodoId = null;

// Setup: Create a test todo with tags
suite.test('setup: create test todo with tags', async () => {
  const isRunning = await ThingsTestHelper.isRunning();
  if (!isRunning) {
    console.log('⏭️  Skipping regression tests - Things 3 not running');
    return;
  }
  
  // Create a todo with initial tags
  const scriptPath = path.join(process.cwd(), 'jxa', 'build', 'add_todo.js');
  const params = {
    operation: 'add_todo',
    name: 'Test Todo for Tag Removal',
    tags: ['test', 'regression', 'issue-3']
  };
  
  const result = execSync(`osascript -l JavaScript "${scriptPath}" '${JSON.stringify(params)}'`, { encoding: 'utf8' });
  const parsed = JSON.parse(result);
  
  expect.toEqual(parsed.success, true);
  expect.toHaveProperty(parsed.data, 'id');
  expect.toHaveProperty(parsed.data, 'tags');
  expect.toHaveLength(parsed.data.tags, 3);
  
  testTodoId = parsed.data.id;
});

// Test the core issue: removing tags with empty array
suite.test('can remove all tags using empty array', async () => {
  if (!testTodoId) {
    console.log('⏭️  Skipping - setup failed');
    return;
  }
  
  const scriptPath = path.join(process.cwd(), 'jxa', 'build', 'update_todo.js');
  const params = {
    operation: 'update_todo',
    id: testTodoId,
    tags: [] // This should remove all tags
  };
  
  const result = execSync(`osascript -l JavaScript "${scriptPath}" '${JSON.stringify(params)}'`, { encoding: 'utf8' });
  const parsed = JSON.parse(result);
  
  expect.toEqual(parsed.success, true);
  expect.toHaveProperty(parsed.data, 'tags');
  expect.toHaveLength(parsed.data.tags, 0);
  expect.toEqual(parsed.data.tagNames, ''); // Should be empty string
});

// Test that tags can be added back
suite.test('can add tags back after removal', async () => {
  if (!testTodoId) {
    console.log('⏭️  Skipping - setup failed');
    return;
  }
  
  const scriptPath = path.join(process.cwd(), 'jxa', 'build', 'update_todo.js');
  const params = {
    operation: 'update_todo',
    id: testTodoId,
    tags: ['new-tag', 'restored']
  };
  
  const result = execSync(`osascript -l JavaScript "${scriptPath}" '${JSON.stringify(params)}'`, { encoding: 'utf8' });
  const parsed = JSON.parse(result);
  
  expect.toEqual(parsed.success, true);
  expect.toHaveProperty(parsed.data, 'tags');
  expect.toHaveLength(parsed.data.tags, 2);
  expect.toDeepEqual(parsed.data.tags.sort(), ['new-tag', 'restored']);
  expect.toContain(parsed.data.tagNames, 'new-tag');
  expect.toContain(parsed.data.tagNames, 'restored');
});

// Test partial tag removal (replace with different tags)
suite.test('can replace tags with different tags', async () => {
  if (!testTodoId) {
    console.log('⏭️  Skipping - setup failed');
    return;
  }
  
  const scriptPath = path.join(process.cwd(), 'jxa', 'build', 'update_todo.js');
  const params = {
    operation: 'update_todo',
    id: testTodoId,
    tags: ['completely', 'different', 'tags']
  };
  
  const result = execSync(`osascript -l JavaScript "${scriptPath}" '${JSON.stringify(params)}'`, { encoding: 'utf8' });
  const parsed = JSON.parse(result);
  
  expect.toEqual(parsed.success, true);
  expect.toHaveProperty(parsed.data, 'tags');
  expect.toHaveLength(parsed.data.tags, 3);
  expect.toDeepEqual(parsed.data.tags.sort(), ['completely', 'different', 'tags']);
});

// Test edge cases that might have caused the original issue
suite.test('handles null tags parameter correctly', async () => {
  if (!testTodoId) {
    console.log('⏭️  Skipping - setup failed');
    return;
  }
  
  // Test that passing null doesn't change tags (undefined behavior)
  const scriptPath = path.join(process.cwd(), 'jxa', 'build', 'update_todo.js');
  const params = {
    operation: 'update_todo',
    id: testTodoId,
    name: 'Updated name only' // Don't include tags parameter
  };
  
  const result = execSync(`osascript -l JavaScript "${scriptPath}" '${JSON.stringify(params)}'`, { encoding: 'utf8' });
  const parsed = JSON.parse(result);
  
  expect.toEqual(parsed.success, true);
  expect.toEqual(parsed.data.name, 'Updated name only');
  // Tags should remain unchanged from previous test
  expect.toHaveLength(parsed.data.tags, 3);
});

// Test the original issue scenario: verify empty array works
suite.test('empty array explicitly removes all tags (issue #3 fix)', async () => {
  if (!testTodoId) {
    console.log('⏭️  Skipping - setup failed');
    return;
  }
  
  // First, make sure we have tags
  const setupScript = path.join(process.cwd(), 'jxa', 'build', 'update_todo.js');
  const setupParams = {
    operation: 'update_todo',
    id: testTodoId,
    tags: ['tag1', 'tag2', 'tag3']
  };
  
  let result = execSync(`osascript -l JavaScript "${setupScript}" '${JSON.stringify(setupParams)}'`, { encoding: 'utf8' });
  let parsed = JSON.parse(result);
  
  expect.toEqual(parsed.success, true);
  expect.toHaveLength(parsed.data.tags, 3);
  
  // Now test the fix: empty array should remove all tags
  const removeParams = {
    operation: 'update_todo',
    id: testTodoId,
    tags: [] // The fix for Issue #3
  };
  
  result = execSync(`osascript -l JavaScript "${setupScript}" '${JSON.stringify(removeParams)}'`, { encoding: 'utf8' });
  parsed = JSON.parse(result);
  
  expect.toEqual(parsed.success, true);
  expect.toHaveLength(parsed.data.tags, 0);
  expect.toEqual(parsed.data.tagNames, '');
});

// Test that the fix works for projects too
suite.test('tag removal also works for projects', async () => {
  if (!await ThingsTestHelper.isRunning()) {
    console.log('⏭️  Skipping - Things 3 not running');
    return;
  }
  
  // Create a test project with tags
  const addScript = path.join(process.cwd(), 'jxa', 'build', 'add_project.js');
  const addParams = {
    operation: 'add_project',
    name: 'Test Project for Tag Removal',
    tags: ['project-tag', 'test']
  };
  
  let result = execSync(`osascript -l JavaScript "${addScript}" '${JSON.stringify(addParams)}'`, { encoding: 'utf8' });
  let parsed = JSON.parse(result);
  
  expect.toEqual(parsed.success, true);
  expect.toHaveLength(parsed.data.tags, 2);
  
  const projectId = parsed.data.id;
  
  // Remove tags from project
  const updateScript = path.join(process.cwd(), 'jxa', 'build', 'update_project.js');
  const updateParams = {
    operation: 'update_project',
    id: projectId,
    tags: []
  };
  
  result = execSync(`osascript -l JavaScript "${updateScript}" '${JSON.stringify(updateParams)}'`, { encoding: 'utf8' });
  parsed = JSON.parse(result);
  
  expect.toEqual(parsed.success, true);
  expect.toHaveLength(parsed.data.tags, 0);
  expect.toEqual(parsed.data.tagNames, '');
  
  // Clean up the test project
  try {
    const cleanupScript = `
      function run(argv) {
        try {
          const params = JSON.parse(argv[0] || '{}');
          const things = Application('com.culturedcode.ThingsMac');
          const project = things.projects.byId(params.id);
          things.delete(project);
          return JSON.stringify({ success: true });
        } catch (error) {
          return JSON.stringify({ success: false, error: { message: error.message } });
        }
      }
    `;
    
    await ThingsTestHelper.executeJXA(cleanupScript, { id: projectId });
  } catch (e) {
    // Clean up failed, but that's not critical for the test
  }
});

// Cleanup: Remove test todo
suite.test('cleanup: remove test todo', async () => {
  if (!testTodoId) {
    console.log('⏭️  No cleanup needed');
    return;
  }
  
  try {
    const script = `
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
    
    await ThingsTestHelper.executeJXA(script, { id: testTodoId });
    console.log('✅ Test todo cleaned up');
  } catch (error) {
    console.log('⚠️  Cleanup failed:', error.message);
  }
});

// Run the tests
suite.run().catch(() => process.exit(1));