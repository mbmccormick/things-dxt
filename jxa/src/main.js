/**
 * Main entry point for JXA Things operations
 * Handles argument parsing, error catching, and response formatting
 */

import { TodoOperations } from './todos.js';
import { ProjectOperations } from './projects.js';
import { ListOperations } from './lists.js';
import { SearchOperations } from './search.js';
import { TagOperations } from './tags.js';
import { AreaOperations } from './areas.js';

// Global entry point for JXA
function run(argv) {
  try {
    // Parse arguments - first arg is JSON parameters, second is operation
    const params = JSON.parse(argv[0] || '{}');
    const operation = params.operation || 'unknown';
    
    // Get Things application reference
    const things = Application('com.culturedcode.ThingsMac');
    things.includeStandardAdditions = false;
    
    // Route to appropriate operation handler
    let result;
    
    switch (operation) {
      // Todo operations
      case 'add_todo':
        result = TodoOperations.add(things, params);
        break;
      case 'update_todo':
        result = TodoOperations.update(things, params);
        break;
      case 'get_todos':
        result = TodoOperations.getAll(things, params);
        break;
        
      // Project operations
      case 'add_project':
        result = ProjectOperations.add(things, params);
        break;
      case 'update_project':
        result = ProjectOperations.update(things, params);
        break;
      case 'get_projects':
        result = ProjectOperations.getAll(things, params);
        break;
        
      // List operations (inbox, today, etc.)
      case 'get_inbox':
        result = ListOperations.getInbox(things, params);
        break;
      case 'get_today':
        result = ListOperations.getToday(things, params);
        break;
      case 'get_upcoming':
        result = ListOperations.getUpcoming(things, params);
        break;
      case 'get_anytime':
        result = ListOperations.getAnytime(things, params);
        break;
      case 'get_someday':
        result = ListOperations.getSomeday(things, params);
        break;
      case 'get_logbook':
        result = ListOperations.getLogbook(things, params);
        break;
      case 'get_trash':
        result = ListOperations.getTrash(things, params);
        break;
        
      // Search operations
      case 'search_todos':
        result = SearchOperations.searchTodos(things, params);
        break;
      case 'search_items':
        result = SearchOperations.searchItems(things, params);
        break;
      case 'search_advanced':
        result = SearchOperations.searchAdvanced(things, params);
        break;
      case 'get_recent':
        result = SearchOperations.getRecent(things, params);
        break;
      case 'show_item':
        result = SearchOperations.showItem(things, params);
        break;
        
      // Tag operations
      case 'get_tags':
        result = TagOperations.getAll(things, params);
        break;
      case 'get_tagged_items':
        result = TagOperations.getTaggedItems(things, params);
        break;
        
      // Area operations
      case 'get_areas':
        result = AreaOperations.getAll(things, params);
        break;
        
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
    
    // Return success response
    return JSON.stringify({
      success: true,
      data: result
    });
    
  } catch (error) {
    // Return error response
    return JSON.stringify({
      success: false,
      error: {
        message: error.message || String(error),
        type: error.name || 'Error',
        stack: error.stack
      }
    });
  }
}

// Export for bundling
export { run };