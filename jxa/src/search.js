/**
 * Search operations for Things 3
 */

import { mapTodo, mapProject, mapArea, parseTags, LIST_IDS } from './utils.js';

export class SearchOperations {
  
  /**
   * Search todos by query
   */
  static searchTodos(things, params) {
    const query = params.query.toLowerCase();
    const allTodos = things.toDos();
    
    const matches = allTodos.filter(todo => {
      try {
        const name = todo.name().toLowerCase();
        const notes = (todo.notes() || '').toLowerCase();
        return name.includes(query) || notes.includes(query);
      } catch (e) {
        return false;
      }
    });
    
    return matches.map(mapTodo);
  }
  
  /**
   * Search all items (todos, projects, areas)
   */
  static searchItems(things, params) {
    const query = params.query.toLowerCase();
    const results = [];
    
    // Search todos
    try {
      const todos = things.toDos();
      todos.forEach(todo => {
        try {
          const name = todo.name().toLowerCase();
          const notes = (todo.notes() || '').toLowerCase();
          if (name.includes(query) || notes.includes(query)) {
            results.push({
              type: 'todo',
              ...mapTodo(todo)
            });
          }
        } catch (e) {}
      });
    } catch (e) {}
    
    // Search projects
    try {
      const projects = things.projects();
      projects.forEach(project => {
        try {
          const name = project.name().toLowerCase();
          const notes = (project.notes() || '').toLowerCase();
          if (name.includes(query) || notes.includes(query)) {
            results.push({
              type: 'project',
              ...mapProject(project)
            });
          }
        } catch (e) {}
      });
    } catch (e) {}
    
    // Search areas
    try {
      const areas = things.areas();
      areas.forEach(area => {
        try {
          const name = area.name().toLowerCase();
          if (name.includes(query)) {
            results.push({
              type: 'area',
              ...mapArea(area)
            });
          }
        } catch (e) {}
      });
    } catch (e) {}
    
    return results;
  }
  
  /**
   * Advanced search with multiple criteria
   */
  static searchAdvanced(things, params) {
    const query = params.query.toLowerCase();
    let todos = [];
    
    // Get base todos
    try {
      todos = Array.from(things.toDos());
    } catch (e) {
      return [];
    }
    
    // Include completed items if requested
    if (params.completed) {
      try {
        const logbook = things.lists.byId(LIST_IDS.LOGBOOK).toDos();
        todos = todos.concat(Array.from(logbook));
      } catch (e) {}
    }
    
    // Include canceled items if requested
    if (params.canceled) {
      try {
        const allTodos = things.toDos();
        const canceled = allTodos.filter(t => {
          try {
            return t.status() === 'canceled';
          } catch (e) {
            return false;
          }
        });
        todos = todos.concat(canceled);
      } catch (e) {}
    }
    
    // Include trashed items if requested
    if (params.trashed) {
      try {
        const trash = things.lists.byId(LIST_IDS.TRASH).toDos();
        todos = todos.concat(Array.from(trash));
      } catch (e) {}
    }
    
    // Search by query
    let matches = todos.filter(todo => {
      try {
        const name = todo.name().toLowerCase();
        const notes = (todo.notes() || '').toLowerCase();
        return name.includes(query) || notes.includes(query);
      } catch (e) {
        return false;
      }
    });
    
    // Filter by tags if specified
    if (params.tags && params.tags.length > 0) {
      matches = matches.filter(todo => {
        try {
          const tagNames = todo.tagNames() || '';
          const todoTags = parseTags(tagNames);
          return params.tags.some(tag => todoTags.includes(tag));
        } catch (e) {
          return false;
        }
      });
    }
    
    return matches.map(mapTodo);
  }
  
  /**
   * Get recent items
   */
  static getRecent(things, params) {
    const days = params.days || 7;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    let allTodos;
    try {
      allTodos = things.toDos();
    } catch (e) {
      return [];
    }
    
    const recent = allTodos.filter(todo => {
      try {
        const modDate = todo.modificationDate();
        return modDate && modDate >= cutoffDate;
      } catch (e) {
        return false;
      }
    });
    
    // Sort by modification date (newest first)
    recent.sort((a, b) => {
      try {
        const dateA = a.modificationDate();
        const dateB = b.modificationDate();
        return dateB - dateA;
      } catch (e) {
        return 0;
      }
    });
    
    return recent.map(mapTodo);
  }
  
  /**
   * Show single item details
   */
  static showItem(things, params) {
    const id = params.id;
    
    // Try to find as todo first
    try {
      const item = things.toDos.byId(id);
      return {
        type: 'todo',
        ...mapTodo(item)
      };
    } catch (e) {}
    
    // Try as project
    try {
      const item = things.projects.byId(id);
      return {
        type: 'project',
        ...mapProject(item)
      };
    } catch (e) {}
    
    // Try as area
    try {
      const item = things.areas.byId(id);
      return {
        type: 'area',
        ...mapArea(item)
      };
    } catch (e) {}
    
    throw new Error(`Item not found with id: ${id}`);
  }
}