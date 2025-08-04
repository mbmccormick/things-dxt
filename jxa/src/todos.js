/**
 * Todo operations for Things 3
 */

import { mapTodo, formatTags, scheduleItem, parseLocalDate } from './utils.js';

export class TodoOperations {
  
  /**
   * Add a new todo
   */
  static add(things, params) {
    // Create the todo
    const todoProps = {
      name: params.name
    };
    
    if (params.notes) {
      todoProps.notes = params.notes;
    }
    
    const todo = things.ToDo(todoProps);
    things.toDos.push(todo);
    
    // Set tags (convert array to comma-separated string)
    if (params.tags && params.tags.length > 0) {
      todo.tagNames = formatTags(params.tags);
    }
    
    
    // Schedule activation date (when to work on)
    if (params.activation_date) {
      scheduleItem(things, todo, params.activation_date);
    }
    
    // Set due date (when actually due)
    if (params.due_date) {
      todo.dueDate = parseLocalDate(params.due_date);
    }
    
    // Add to list/project
    if (params.list_id) {
      try {
        const list = things.lists.byId(params.list_id);
        list.toDos.push(todo);
      } catch (e) {
        // List not found, todo stays in inbox
      }
    } else if (params.list_title) {
      let targetList;
      
      // Check projects
      try {
        const projects = things.projects();
        for (let project of projects) {
          if (project.name() === params.list_title) {
            targetList = project;
            break;
          }
        }
      } catch (e) {}
      
      // Check areas if not found in projects
      if (!targetList) {
        try {
          const areas = things.areas();
          for (let area of areas) {
            if (area.name() === params.list_title) {
              targetList = area;
              break;
            }
          }
        } catch (e) {}
      }
      
      if (targetList) {
        targetList.toDos.push(todo);
      }
    }
    
    // Add to heading within project
    if (params.heading && params.list_id) {
      try {
        const project = things.projects.byId(params.list_id);
        const todos = project.toDos();
        const headings = todos.filter(t => t.name() === params.heading);
        if (headings.length > 0) {
          const heading = headings[0];
          const headingIndex = todos.indexOf(heading);
          things.move(todo, { to: project.toDos[headingIndex] });
        }
      } catch (e) {
        // Heading not found or move failed
      }
    }
    
    return mapTodo(todo);
  }
  
  /**
   * Update an existing todo
   */
  static update(things, params) {
    // Try to find the item as either a todo or a project
    let todo = null;
    let isProject = false;
    
    try {
      todo = things.toDos.byId(params.id);
    } catch (e) {
      try {
        todo = things.projects.byId(params.id);
        isProject = true;
      } catch (e2) {
        throw new Error(`Todo/Project with id ${params.id} not found`);
      }
    }
    
    // Update basic properties
    if (params.name !== undefined) {
      todo.name = params.name;
    }
    
    if (params.notes !== undefined) {
      todo.notes = params.notes;
    }
    
    // Update tags - empty array means remove all tags
    if (params.tags !== undefined) {
      todo.tagNames = formatTags(params.tags);
    }
    
    // Update status
    if (params.completed === true) {
      todo.status = 'completed';
    } else if (params.canceled === true) {
      todo.status = 'canceled';
    }
    
    // Update dates
    if (params.activation_date !== undefined) {
      if (params.activation_date) {
        scheduleItem(things, todo, params.activation_date);
      } else {
        // Clear activation date by scheduling to far future then back
        try {
          scheduleItem(things, todo, '2099-12-31');
          things.schedule(todo, { for: null });
        } catch (e) {
          // Schedule clearing failed
        }
      }
    }
    
    if (params.due_date !== undefined) {
      todo.dueDate = params.due_date ? parseLocalDate(params.due_date) : null;
    }
    
    
    return mapTodo(todo);
  }
  
  /**
   * Get all todos, optionally filtered by project
   */
  static getAll(things, params) {
    let todos;
    
    if (params.project_uuid) {
      try {
        const project = things.projects.byId(params.project_uuid);
        todos = project.toDos();
      } catch (e) {
        return [];
      }
    } else {
      todos = things.toDos();
    }
    
    const includeItems = params.include_items !== false; // default true
    
    if (includeItems) {
      return todos.map(mapTodo);
    } else {
      // Just return basic info
      return todos.map(todo => ({
        id: todo.id(),
        name: todo.name(),
        status: todo.status()
      }));
    }
  }
}