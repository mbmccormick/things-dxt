/**
 * Test for project todos functionality
 */

import { strict as assert } from 'assert';
import { JXATemplates } from '../server/jxa-templates.js';
import { ParameterMapper } from '../server/utils.js';

console.log("Testing project todos functionality...\n");

function testCreateProjectWithTodos() {
  console.log("✅ createProject with todos parameter mapping");
  
  const args = {
    title: "Road Trip Todo List",
    notes: "Complete all tasks before the road trip",
    todos: ["Pack snacks", "Get gas", "Check tires"]
  };
  
  // Test parameter mapping
  const scriptParams = ParameterMapper.validateAndMapParameters(args);
  
  // Verify parameter mapping works
  assert.equal(scriptParams.name, "Road Trip Todo List");
  assert.equal(scriptParams.notes, "Complete all tasks before the road trip");
  assert.deepEqual(scriptParams.todos, ["Pack snacks", "Get gas", "Check tires"]);
  
  // Generate the JXA script
  const script = JXATemplates.createProject();
  
  // Verify the script is valid JXA
  assert(typeof script === 'string');
  assert(script.includes('function run'));
}

function testCreateProjectWithoutTodos() {
  console.log("✅ createProject parameter mapping without todos");
  
  const args = {
    title: "Simple Project",
    notes: "A project without todos"
  };
  
  const scriptParams = ParameterMapper.validateAndMapParameters(args);
  
  // Verify parameter mapping works correctly
  assert.equal(scriptParams.name, "Simple Project");
  assert.equal(scriptParams.notes, "A project without todos");
  assert.equal(scriptParams.todos, undefined);
  
  const script = JXATemplates.createProject();
  
  // Verify the script is valid JXA
  assert(typeof script === 'string');
  assert(script.includes('function run'));
}

function testCreateProjectWithEmptyTodos() {
  console.log("✅ createProject handles empty todos array");
  
  const args = {
    title: "Project with Empty Todos",
    todos: []
  };
  
  const scriptParams = ParameterMapper.validateAndMapParameters(args);
  
  // Verify parameter mapping handles empty array
  assert.equal(scriptParams.name, "Project with Empty Todos");
  assert.deepEqual(scriptParams.todos, []);
  
  const script = JXATemplates.createProject();
  
  // Verify the script is valid JXA
  assert(typeof script === 'string');
  assert(script.includes('function run'));
}

// Run tests
try {
  testCreateProjectWithTodos();
  testCreateProjectWithoutTodos();
  testCreateProjectWithEmptyTodos();
  
  console.log("\n✨ All project todos tests passed!");
} catch (error) {
  console.error("\n❌ Test failed:", error.message);
  console.error(error.stack);
  process.exit(1);
}