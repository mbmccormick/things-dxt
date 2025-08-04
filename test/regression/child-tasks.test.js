#!/usr/bin/env node

/**
 * Regression tests for Child Tasks (Issue #11)
 * 
 * Tests that child tasks can be added and modified on existing todos
 * using the correct Things 3 API (project.toDos() method)
 */

import { TestSuite, expect, ThingsTestHelper } from '../test-utils.js';
import { execSync } from 'child_process';
import path from 'path';

const suite = new TestSuite('Child Tasks Regression Tests (Issue #11)');

let testTodoId = null;

// Setup: Create a test todo
suite.test('setup: create test todo for child task testing', async () => {
  const isRunning = await ThingsTestHelper.isRunning();
  if (!isRunning) {
    console.log('⏭️  Skipping regression tests - Things 3 not running');
    return;
  }
  
  const scriptPath = path.join(process.cwd(), 'jxa', 'build', 'add_todo.js');
  const params = {
    operation: 'add_todo',
    name: 'Test Todo for Child Tasks',
    notes: 'Testing child task functionality'
  };
  
  // Use temp file to avoid shell escaping issues
  const fs = await import('fs');
  const tempParamsFile = '/tmp/test-params.json';
  fs.writeFileSync(tempParamsFile, JSON.stringify(params));
  
  const result = execSync(`osascript -l JavaScript \"${scriptPath}\" \"$(cat ${tempParamsFile})\"`, { encoding: 'utf8' });
  const parsed = JSON.parse(result);
  
  // Clean up temp file
  try { fs.unlinkSync(tempParamsFile); } catch (e) {}
  
  expect.toEqual(parsed.success, true);
  expect.toHaveProperty(parsed.data, 'id');
  expect.toHaveProperty(parsed.data, 'childTasks');
  expect.toHaveLength(parsed.data.childTasks, 0);
  
  testTodoId = parsed.data.id;
});

// Test adding child tasks to existing todo (converts it to project)
suite.test('can add child tasks to existing todo (creates project)', async () => {
  if (!testTodoId) {
    console.log('⏭️  Skipping - setup failed');
    return;
  }
  
  const scriptPath = path.join(process.cwd(), 'jxa', 'build', 'update_todo.js');
  const params = {
    operation: 'update_todo',
    id: testTodoId,
    child_tasks: ['First child task', 'Second child task', 'Third child task']
  };
  
  // Use temp file to avoid shell escaping issues
  const fs = await import('fs');
  const tempParamsFile = '/tmp/test-params.json';
  fs.writeFileSync(tempParamsFile, JSON.stringify(params));
  
  const result = execSync(`osascript -l JavaScript \"${scriptPath}\" \"$(cat ${tempParamsFile})\"`, { encoding: 'utf8' });
  const parsed = JSON.parse(result);
  
  // Clean up temp file
  try { fs.unlinkSync(tempParamsFile); } catch (e) {}
  
  expect.toEqual(parsed.success, true);
  expect.toHaveProperty(parsed.data, 'childTasks');
  expect.toHaveLength(parsed.data.childTasks, 3);
  
  // Verify the child tasks have the correct structure
  const childTasks = parsed.data.childTasks;
  expect.toEqual(childTasks[0].name, 'First child task');
  expect.toEqual(childTasks[1].name, 'Second child task');  
  expect.toEqual(childTasks[2].name, 'Third child task');
  
  // All child tasks should start as open
  childTasks.forEach(task => {
    expect.toHaveProperty(task, 'status');
    expect.toEqual(task.status, 'open');
    expect.toEqual(task.completed, false);
  });
});

// Test modifying existing child tasks
suite.test('can modify existing child tasks', async () => {
  if (!testTodoId) {
    console.log('⏭️  Skipping - setup failed');
    return;
  }
  
  const scriptPath = path.join(process.cwd(), 'jxa', 'build', 'update_todo.js');
  const params = {
    operation: 'update_todo',
    id: testTodoId,
    child_tasks: ['Modified first task', 'Modified second task'] // Fewer tasks
  };
  
  // Use temp file to avoid shell escaping issues
  const fs = await import('fs');
  const tempParamsFile = '/tmp/test-params.json';
  fs.writeFileSync(tempParamsFile, JSON.stringify(params));
  
  const result = execSync(`osascript -l JavaScript \"${scriptPath}\" \"$(cat ${tempParamsFile})\"`, { encoding: 'utf8' });
  const parsed = JSON.parse(result);
  
  // Clean up temp file
  try { fs.unlinkSync(tempParamsFile); } catch (e) {}
  
  expect.toEqual(parsed.success, true);
  expect.toHaveProperty(parsed.data, 'childTasks');
  expect.toHaveLength(parsed.data.childTasks, 2);
  
  expect.toEqual(parsed.data.childTasks[0].name, 'Modified first task');
  expect.toEqual(parsed.data.childTasks[1].name, 'Modified second task');
});

// Test removing all child tasks
suite.test('can remove all child tasks with empty array', async () => {
  if (!testTodoId) {
    console.log('⏭️  Skipping - setup failed');
    return;
  }
  
  const scriptPath = path.join(process.cwd(), 'jxa', 'build', 'update_todo.js');
  const params = {
    operation: 'update_todo',
    id: testTodoId,
    child_tasks: [] // Empty array should remove all tasks
  };
  
  // Use temp file to avoid shell escaping issues
  const fs = await import('fs');
  const tempParamsFile = '/tmp/test-params.json';
  fs.writeFileSync(tempParamsFile, JSON.stringify(params));
  
  const result = execSync(`osascript -l JavaScript \"${scriptPath}\" \"$(cat ${tempParamsFile})\"`, { encoding: 'utf8' });
  const parsed = JSON.parse(result);
  
  // Clean up temp file
  try { fs.unlinkSync(tempParamsFile); } catch (e) {}
  
  expect.toEqual(parsed.success, true);
  expect.toHaveProperty(parsed.data, 'childTasks');
  expect.toHaveLength(parsed.data.childTasks, 0);
});

// Test adding child tasks during todo creation
suite.test('can add child tasks during todo creation', async () => {
  if (!await ThingsTestHelper.isRunning()) {
    console.log('⏭️  Skipping - Things 3 not running');
    return;
  }
  
  const scriptPath = path.join(process.cwd(), 'jxa', 'build', 'add_todo.js');
  const params = {
    operation: 'add_todo',
    name: 'Todo with Initial Child Tasks',
    child_tasks: ['Initial task 1', 'Initial task 2']
  };
  
  // Use temp file to avoid shell escaping issues
  const fs = await import('fs');
  const tempParamsFile = '/tmp/test-params.json';
  fs.writeFileSync(tempParamsFile, JSON.stringify(params));
  
  const result = execSync(`osascript -l JavaScript \"${scriptPath}\" \"$(cat ${tempParamsFile})\"`, { encoding: 'utf8' });
  const parsed = JSON.parse(result);
  
  // Clean up temp file
  try { fs.unlinkSync(tempParamsFile); } catch (e) {}
  
  expect.toEqual(parsed.success, true);
  expect.toHaveProperty(parsed.data, 'childTasks');
  expect.toHaveLength(parsed.data.childTasks, 2);
  
  expect.toEqual(parsed.data.childTasks[0].name, 'Initial task 1');
  expect.toEqual(parsed.data.childTasks[1].name, 'Initial task 2');
  
  // Clean up this test todo 
  const cleanupTodoId = parsed.data.id;
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
    
    await ThingsTestHelper.executeJXA(script, { id: cleanupTodoId });
  } catch (e) {
    // Cleanup failed, but not critical
  }
});

// Test that other todo properties aren't affected when updating child tasks
suite.test('updating child tasks preserves other todo properties', async () => {
  if (!testTodoId) {
    console.log('⏭️  Skipping - setup failed');
    return;
  }
  
  // First, set some properties
  const setupScript = path.join(process.cwd(), 'jxa', 'build', 'update_todo.js');
  const setupParams = {
    operation: 'update_todo',
    id: testTodoId,
    name: 'Updated Todo Name',
    notes: 'Updated notes',
    tags: ['important', 'child-task-test']
  };
  
  // Use temp file to avoid shell escaping issues
  const fs = await import('fs');
  const tempParamsFile = '/tmp/test-params.json';
  fs.writeFileSync(tempParamsFile, JSON.stringify(setupParams));
  
  let result = execSync(`osascript -l JavaScript \"${setupScript}\" \"$(cat ${tempParamsFile})\"`, { encoding: 'utf8' });
  let parsed = JSON.parse(result);
  
  expect.toEqual(parsed.success, true);
  expect.toEqual(parsed.data.name, 'Updated Todo Name');
  expect.toEqual(parsed.data.notes, 'Updated notes');
  expect.toHaveLength(parsed.data.tags, 2);
  
  // Now update only child tasks
  const childTaskParams = {
    operation: 'update_todo',
    id: testTodoId,
    child_tasks: ['New child task']
  };
  
  fs.writeFileSync(tempParamsFile, JSON.stringify(childTaskParams));
  result = execSync(`osascript -l JavaScript \"${setupScript}\" \"$(cat ${tempParamsFile})\"`, { encoding: 'utf8' });
  parsed = JSON.parse(result);
  
  // Clean up temp file
  try { fs.unlinkSync(tempParamsFile); } catch (e) {}
  
  expect.toEqual(parsed.success, true);
  expect.toHaveLength(parsed.data.childTasks, 1);
  expect.toEqual(parsed.data.childTasks[0].name, 'New child task');
  
  // Other properties should be preserved
  expect.toEqual(parsed.data.name, 'Updated Todo Name');
  expect.toEqual(parsed.data.notes, 'Updated notes');
  expect.toHaveLength(parsed.data.tags, 2);
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