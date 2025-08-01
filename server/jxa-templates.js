import { THINGS_LIST_IDS } from './server-config.js';

/**
 * JXA (JavaScript for Automation) Templates for Things 3 Integration
 * 
 * This module contains all JXA templates used to interact with Things 3.
 * Key improvements over legacy AppleScript:
 * - Native JSON support for input/output
 * - Simplified string handling without complex escaping
 * - Better error handling with try-catch
 * - More maintainable JavaScript syntax
 */

export class JXATemplates {
  
  /**
   * Common mapping functions to reduce duplication in JXA templates
   * These functions are defined as strings to be injected into JXA scripts
   * @private
   */
  static COMMON_MAPPINGS = `
    // Safe date extraction utility
    function safeDate(obj, methodName) {
      try {
        const method = obj[methodName];
        if (method) {
          const date = method();
          return date ? date.toISOString() : null;
        }
        return null;
      } catch (e) {
        return null;
      }
    }
    
    // Safe date scheduling utility
    function scheduleItem(item, dateString) {
      if (dateString) {
        try {
          const scheduleDate = new Date(dateString);
          things.schedule(item, {for: scheduleDate});
        } catch (e) {
          // Schedule command failed - activation date is read-only per API
          // No fallback possible since activationDate property is read-only
        }
      }
    }
    
    // Safe list access utility
    function safeGetList(listId) {
      try {
        return things.lists.byId(listId).toDos();
      } catch (e) {
        return [];
      }
    }
    
    // Common todo mapping function with safe date handling
    function mapTodo(todo, includeProject = true, includeArea = true) {
      const mapped = {
        id: todo.id(),
        name: todo.name(),
        notes: todo.notes ? todo.notes() : '',
        status: todo.status(),
        dueDate: safeDate(todo, 'dueDate'),
        when: safeDate(todo, 'activationDate'),
        tags: todo.tagNames ? todo.tagNames() : [],
        creationDate: safeDate(todo, 'creationDate'),
        modificationDate: safeDate(todo, 'modificationDate'),
        completionDate: safeDate(todo, 'completionDate')
      };
      
      if (includeProject && todo.project && todo.project()) {
        mapped.project = {
          id: todo.project().id(),
          name: todo.project().name()
        };
      } else {
        mapped.project = null;
      }
      
      if (includeArea && todo.area && todo.area()) {
        mapped.area = {
          id: todo.area().id(),
          name: todo.area().name()
        };
      } else {
        mapped.area = null;
      }
      
      return mapped;
    }
    
    // Common project mapping function with safe date handling
    function mapProject(project) {
      return {
        id: project.id(),
        name: project.name(),
        notes: project.notes ? project.notes() : '',
        status: project.status(),
        deadline: safeDate(project, 'dueDate'),
        due_date: safeDate(project, 'activationDate'),
        area: project.area && project.area() ? {
          id: project.area().id(),
          name: project.area().name()
        } : null,
        tags: project.tagNames ? project.tagNames() : [],
        creationDate: safeDate(project, 'creationDate'),
        modificationDate: safeDate(project, 'modificationDate'),
        completionDate: safeDate(project, 'completionDate')
      };
    }
    
    // Simple todo mapping for basic operations
    function mapTodoSimple(todo) {
      return {
        id: todo.id(),
        name: todo.name(),
        status: todo.status()
      };
    }
  `;

  /**
   * Pre-compiled template parts for optimal performance
   * @private
   */
  static TEMPLATE_PREFIX = `
function run(argv) {
  try {
    const params = argv[0] ? JSON.parse(argv[0]) : {};
    const things = Application('com.culturedcode.ThingsMac');
    things.includeStandardAdditions = true;
    `;

  static TEMPLATE_SUFFIX = `
  } catch (error) {
    return JSON.stringify({
      success: false,
      error: {
        type: error.name || 'UnknownError',
        message: error.message || 'An unknown error occurred',
        code: error.errorNumber || -1
      }
    });
  }
}`;

  /**
   * Generate a JXA script wrapper with error handling
   * Optimized to avoid template literal overhead
   * @private
   */
  static wrapScript(functionBody, includeCommonMappings = true) {
    if (includeCommonMappings) {
      return this.TEMPLATE_PREFIX + this.COMMON_MAPPINGS + functionBody + this.TEMPLATE_SUFFIX;
    } else {
      return this.TEMPLATE_PREFIX + functionBody + this.TEMPLATE_SUFFIX;
    }
  }

  /**
   * Check if Things 3 is running
   */
  static isThingsRunning() {
    return this.wrapScript(`
    const systemEvents = Application('System Events');
    const processes = systemEvents.processes.name();
    const isRunning = processes.includes('Things3');
    
    return JSON.stringify({
      success: true,
      data: isRunning
    });`, false);  // Don't include common mappings for this simple check
  }

  /**
   * Get all tags
   */
  static getTags() {
    return this.wrapScript(`
    const tags = things.tags();
    const tagNames = tags.map(tag => tag.name());
    
    return JSON.stringify({
      success: true,
      data: tagNames
    });`);
  }

  /**
   * Get areas with optional item details
   */
  static getAreas(includeItems = false) {
    return this.wrapScript(`
    let areas;
    try {
      areas = things.areas();
    } catch (e) {
      return JSON.stringify({
        success: false,
        error: {
          type: 'AccessError',
          message: 'Unable to access areas',
          code: -1
        }
      });
    }
    
    const areaData = areas.map(area => {
      try {
        const data = {
          id: area.id(),
          name: area.name(),
          tags: area.tagNames ? area.tagNames() : []
        };
        
        if (${includeItems}) {
          try {
            data.projects = area.projects().length;
            data.todos = area.toDos().length;
          } catch (e) {
            // If counting fails, set to 0
            data.projects = 0;
            data.todos = 0;
          }
        }
        
        return data;
      } catch (e) {
        // Skip malformed areas
        return null;
      }
    }).filter(area => area !== null);
    
    return JSON.stringify({
      success: true,
      data: areaData
    });`);
  }

  /**
   * Get inbox todos
   */
  static getInbox() {
    return this.wrapScript(`
    const todos = safeGetList('TMInboxListSource');
    const todoData = todos.map(todo => mapTodo(todo, false, false));
    
    return JSON.stringify({
      success: true,
      data: todoData
    });`);
  }

  /**
   * Get today's todos
   */
  static getToday() {
    return this.wrapScript(`
    const todos = safeGetList('TMTodayListSource');
    const todoData = todos.map(todo => mapTodo(todo, true, true));
    
    return JSON.stringify({
      success: true,
      data: todoData
    });`);
  }

  /**
   * Get upcoming todos
   */
  static getUpcoming() {
    return this.wrapScript(`
    const todos = safeGetList('TMUpcomingListSource');
    const todoData = todos.map(todo => mapTodo(todo, true, true));
    
    return JSON.stringify({
      success: true,
      data: todoData
    });`);
  }

  /**
   * Get anytime todos
   */
  static getAnytime() {
    return this.wrapScript(`
    const todos = safeGetList('TMAnytimeListSource');
    const todoData = todos.map(todo => mapTodo(todo, true, true));
    
    return JSON.stringify({
      success: true,
      data: todoData
    });`);
  }

  /**
   * Get someday todos
   */
  static getSomeday() {
    return this.wrapScript(`
    const todos = safeGetList('TMSomedayListSource');
    const todoData = todos.map(todo => mapTodo(todo, true, true));
    
    return JSON.stringify({
      success: true,
      data: todoData
    });`);
  }

  /**
   * Get projects
   */
  static getProjects(includeItems = false) {
    return this.wrapScript(`
    const projects = things.projects().filter(p => p.status() === 'open');
    
    const projectData = projects.map(project => {
      const data = mapProject(project);
      
      if (${includeItems}) {
        data.todos = project.toDos().length;
      }
      
      return data;
    });
    
    return JSON.stringify({
      success: true,
      data: projectData
    });`);
  }

  /**
   * Search for todos
   */
  static searchTodos(query) {
    return this.wrapScript(`
    const allTodos = things.toDos();
    const searchQuery = params.query.toLowerCase();
    
    const matchingTodos = allTodos.filter(todo => {
      const name = todo.name().toLowerCase();
      const notes = todo.notes ? todo.notes().toLowerCase() : '';
      return name.includes(searchQuery) || notes.includes(searchQuery);
    });
    
    const todoData = matchingTodos.map(todo => mapTodo(todo, true, true));
    
    return JSON.stringify({
      success: true,
      data: todoData
    });`);
  }

  /**
   * Create a new todo
   */
  static createTodo() {
    return this.wrapScript(`
    // Create the todo object with basic properties
    const todoProps = {
      name: params.title
    };
    
    if (params.notes) {
      todoProps.notes = params.notes;
    }
    
    // Create the todo
    const todo = things.ToDo(todoProps);
    things.toDos.push(todo);
    
    // Set dates if provided
    if (params.deadline) {
      try {
        todo.dueDate = new Date(params.deadline);
      } catch (e) {
        // Ignore invalid deadline dates
      }
    }
    
    scheduleItem(todo, params.when);
    
    // Set tags if provided
    if (params.tags && params.tags.length > 0) {
      try {
        // JXA may require string conversion for tag assignment
        const tagString = params.tags.join(',');
        todo.tagNames = tagString;
      } catch (e) {
        // If tag assignment fails, ignore and continue
      }
    }
    
    // Move to project or area if specified
    if (params.list_id) {
      try {
        const project = things.projects.byId(params.list_id);
        project.toDos.push(todo);
      } catch (e) {
        // Project not found, leave in inbox
      }
    } else if (params.list_title) {
      try {
        const projects = things.projects().filter(p => p.name() === params.list_title);
        if (projects.length > 0) {
          projects[0].toDos.push(todo);
        }
      } catch (e) {
        // Project not found, leave in inbox
      }
    } else if (params.area_id) {
      try {
        const area = things.areas.byId(params.area_id);
        area.toDos.push(todo);
      } catch (e) {
        // Area not found, leave in inbox
      }
    } else if (params.area_title) {
      try {
        const areas = things.areas().filter(a => a.name() === params.area_title);
        if (areas.length > 0) {
          areas[0].toDos.push(todo);
        }
      } catch (e) {
        // Area not found, leave in inbox
      }
    }
    
    // Handle checklist items if provided
    if (params.checklist_items && params.checklist_items.length > 0) {
      // Note: Things 3 JXA doesn't have direct checklist support
      // We'll append them to notes as a workaround
      const checklistText = params.checklist_items.map(item => '- [ ] ' + item).join('\\n');
      const currentNotes = todo.notes() || '';
      todo.notes = currentNotes + (currentNotes ? '\\n\\n' : '') + checklistText;
    }
    
    return JSON.stringify({
      success: true,
      data: {
        id: todo.id(),
        name: todo.name()
      }
    });`);
  }

  /**
   * Create a new project
   */
  static createProject() {
    return this.wrapScript(`
    // Create the project object with basic properties
    const projectProps = {
      name: params.title
    };
    
    if (params.notes) {
      projectProps.notes = params.notes;
    }
    
    // Create the project
    const project = things.Project(projectProps);
    things.projects.push(project);
    
    // Set dates if provided
    if (params.deadline) {
      try {
        project.dueDate = new Date(params.deadline);
      } catch (e) {
        // Ignore invalid deadline dates
      }
    }
    
    scheduleItem(project, params.when);
    
    // Set tags if provided
    if (params.tags && params.tags.length > 0) {
      try {
        // JXA may require string conversion for tag assignment
        const tagString = params.tags.join(',');
        project.tagNames = tagString;
      } catch (e) {
        // If tag assignment fails, ignore and continue
      }
    }
    
    // Move to area if specified
    if (params.area_id) {
      try {
        const area = things.areas.byId(params.area_id);
        area.projects.push(project);
      } catch (e) {
        // Area not found, leave without area
      }
    } else if (params.area_title) {
      try {
        const areas = things.areas().filter(a => a.name() === params.area_title);
        if (areas.length > 0) {
          areas[0].projects.push(project);
        }
      } catch (e) {
        // Area not found, leave without area
      }
    }
    
    // Create todos for the project if provided
    if (params.todos && params.todos.length > 0) {
      params.todos.forEach(todoTitle => {
        const todo = things.ToDo({ name: todoTitle });
        project.toDos.push(todo);
      });
    }
    
    return JSON.stringify({
      success: true,
      data: {
        id: project.id(),
        name: project.name()
      }
    });`);
  }

  /**
   * Update a todo
   */
  static updateTodo() {
    return this.wrapScript(`
    // Find the todo by ID
    let todo;
    try {
      todo = things.toDos.byId(params.id);
    } catch (e) {
      return JSON.stringify({
        success: false,
        error: {
          type: 'NotFound',
          message: 'Todo not found',
          code: -1
        }
      });
    }
    
    // Update properties
    if (params.title !== undefined) {
      todo.name = params.title;
    }
    
    if (params.notes !== undefined) {
      todo.notes = params.notes;
    }
    
    if (params.deadline !== undefined) {
      todo.dueDate = params.deadline ? new Date(params.deadline) : null;
    }
    
    if (params.when !== undefined) {
      if (params.when) {
        scheduleItem(todo, params.when);
      } else {
        // Cannot remove scheduling - activation date is read-only per API
        // Would need to use different approach (e.g., move to Someday list)
      }
    }
    
    if (params.tags !== undefined) {
      try {
        if (params.tags && params.tags.length > 0) {
          const tagString = params.tags.join(',');
          todo.tagNames = tagString;
        } else {
          // Remove all tags
          todo.tagNames = '';
        }
      } catch (e) {
        // If tag assignment fails, ignore
      }
    }
    
    // Handle checklist items if provided
    if (params.checklist_items !== undefined) {
      if (params.checklist_items && params.checklist_items.length > 0) {
        // Things 3 JXA doesn't have direct checklist support
        // We'll append them to notes as a workaround
        const checklistText = params.checklist_items.map(item => '- [ ] ' + item).join('\\\\n');
        const currentNotes = todo.notes() || '';
        todo.notes = currentNotes + (currentNotes ? '\\\\n\\\\n' : '') + checklistText;
      }
      // Note: We don't handle removing checklist items since they're part of notes
    }
    
    if (params.completed !== undefined) {
      todo.status = params.completed ? 'completed' : 'open';
    }
    
    if (params.canceled !== undefined) {
      todo.status = params.canceled ? 'canceled' : 'open';
    }
    
    return JSON.stringify({
      success: true,
      data: {
        id: todo.id(),
        name: todo.name(),
        status: todo.status()
      }
    });`);
  }

  /**
   * Update a project
   */
  static updateProject() {
    return this.wrapScript(`
    // Find the project by ID
    let project;
    try {
      project = things.projects.byId(params.id);
    } catch (e) {
      return JSON.stringify({
        success: false,
        error: {
          type: 'NotFound',
          message: 'Project not found',
          code: -1
        }
      });
    }
    
    // Update properties
    if (params.title !== undefined) {
      project.name = params.title;
    }
    
    if (params.notes !== undefined) {
      project.notes = params.notes;
    }
    
    if (params.deadline !== undefined) {
      project.dueDate = params.deadline ? new Date(params.deadline) : null;
    }
    
    if (params.when !== undefined) {
      if (params.when) {
        scheduleItem(project, params.when);
      } else {
        // Cannot remove scheduling - activation date is read-only per API
        // Would need to use different approach (e.g., move to Someday list)
      }
    }
    
    if (params.tags !== undefined) {
      try {
        if (params.tags && params.tags.length > 0) {
          const tagString = params.tags.join(',');
          project.tagNames = tagString;
        } else {
          // Remove all tags
          project.tagNames = '';
        }
      } catch (e) {
        // If tag assignment fails, ignore
      }
    }
    
    if (params.completed !== undefined) {
      project.status = params.completed ? 'completed' : 'open';
    }
    
    if (params.canceled !== undefined) {
      project.status = params.canceled ? 'canceled' : 'open';
    }
    
    return JSON.stringify({
      success: true,
      data: {
        id: project.id(),
        name: project.name(),
        status: project.status()
      }
    });`);
  }

  /**
   * Get logbook (completed items)
   */
  static getLogbook(limit = 100, daysBack = 7) {
    return this.wrapScript(`
    const logbook = things.lists.byId('TMLogbookListSource');
    const todos = logbook.toDos();
    
    // Filter by completion date if needed
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - ${daysBack});
    
    const filteredTodos = todos.filter(todo => {
      const completionDate = todo.completionDate();
      return completionDate && completionDate >= cutoffDate;
    });
    
    // Limit results
    const limitedTodos = filteredTodos.slice(0, ${limit});
    
    const todoData = limitedTodos.map(todo => ({
      id: todo.id(),
      name: todo.name(),
      notes: todo.notes ? todo.notes() : '',
      status: todo.status(),
      completionDate: safeDate(todo, 'completionDate'),
      project: todo.project() ? {
        id: todo.project().id(),
        name: todo.project().name()
      } : null,
      area: todo.area() ? {
        id: todo.area().id(),
        name: todo.area().name()
      } : null,
      tags: todo.tagNames ? todo.tagNames() : []
    }));
    
    return JSON.stringify({
      success: true,
      data: todoData
    });`);
  }

  /**
   * Get trash
   */
  static getTrash() {
    return this.wrapScript(`
    const trash = things.lists.byId('TMTrashListSource');
    const todos = trash.toDos();
    
    const todoData = todos.map(todo => ({
      id: todo.id(),
      name: todo.name(),
      notes: todo.notes ? todo.notes() : '',
      status: todo.status(),
      project: todo.project() ? {
        id: todo.project().id(),
        name: todo.project().name()
      } : null,
      area: todo.area() ? {
        id: todo.area().id(),
        name: todo.area().name()
      } : null,
      tags: todo.tagNames ? todo.tagNames() : []
    }));
    
    return JSON.stringify({
      success: true,
      data: todoData
    });`);
  }

  /**
   * Get all todos (optionally filtered by project)
   */
  static getTodos() {
    return this.wrapScript(`
    const allTodos = things.toDos().filter(todo => todo.status() === 'open');
    
    // Filter by project if specified
    let filteredTodos = allTodos;
    if (params.project_uuid) {
      filteredTodos = allTodos.filter(todo => {
        const project = todo.project();
        return project && project.id() === params.project_uuid;
      });
    }
    
    const todoData = filteredTodos.map(todo => mapTodo(todo, true, true));
    
    return JSON.stringify({
      success: true,
      data: todoData
    });`);
  }

  /**
   * Advanced search with multiple criteria
   */
  static searchAdvanced() {
    return this.wrapScript(`
    const searchQuery = params.query ? params.query.toLowerCase() : '';
    const searchTags = params.tags || [];
    const includeCompleted = params.completed || false;
    const includeCanceled = params.canceled || false;
    const includeTrashed = params.trashed || false;
    
    // Get all todos and filter by status
    let allTodos = things.toDos();
    
    if (!includeCompleted && !includeCanceled && !includeTrashed) {
      allTodos = allTodos.filter(todo => todo.status() === 'open');
    } else {
      allTodos = allTodos.filter(todo => {
        const status = todo.status();
        return (includeCompleted && status === 'completed') ||
               (includeCanceled && status === 'canceled') ||
               (!includeCompleted && !includeCanceled && status === 'open');
      });
    }
    
    // Filter by search query
    if (searchQuery) {
      allTodos = allTodos.filter(todo => {
        const name = todo.name().toLowerCase();
        const notes = todo.notes ? todo.notes().toLowerCase() : '';
        return name.includes(searchQuery) || notes.includes(searchQuery);
      });
    }
    
    // Filter by tags
    if (searchTags.length > 0) {
      allTodos = allTodos.filter(todo => {
        const todoTags = todo.tagNames ? todo.tagNames() : [];
        return searchTags.some(tag => todoTags.includes(tag));
      });
    }
    
    const todoData = allTodos.map(todo => ({
      id: todo.id(),
      name: todo.name(),
      notes: todo.notes ? todo.notes() : '',
      status: todo.status(),
      dueDate: safeDate(todo, 'dueDate'),
      when: safeDate(todo, 'activationDate'),
      project: todo.project() ? {
        id: todo.project().id(),
        name: todo.project().name()
      } : null,
      area: todo.area() ? {
        id: todo.area().id(),
        name: todo.area().name()
      } : null,
      tags: todo.tagNames ? todo.tagNames() : [],
      creationDate: safeDate(todo, 'creationDate'),
      modificationDate: safeDate(todo, 'modificationDate'),
      completionDate: safeDate(todo, 'completionDate')
    }));
    
    return JSON.stringify({
      success: true,
      data: todoData
    });`);
  }

  /**
   * Get recently modified items
   */
  static getRecent() {
    return this.wrapScript(`
    const daysBack = params.days || 7;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);
    
    const allTodos = things.toDos();
    
    const recentTodos = allTodos.filter(todo => {
      const modDate = todo.modificationDate();
      return modDate && modDate >= cutoffDate;
    });
    
    // Sort by modification date, most recent first
    recentTodos.sort((a, b) => {
      const dateA = a.modificationDate();
      const dateB = b.modificationDate();
      return dateB - dateA;
    });
    
    const todoData = recentTodos.map(todo => ({
      id: todo.id(),
      name: todo.name(),
      notes: todo.notes ? todo.notes() : '',
      status: todo.status(),
      dueDate: safeDate(todo, 'dueDate'),
      when: safeDate(todo, 'activationDate'),
      project: todo.project() ? {
        id: todo.project().id(),
        name: todo.project().name()
      } : null,
      area: todo.area() ? {
        id: todo.area().id(),
        name: todo.area().name()
      } : null,
      tags: todo.tagNames ? todo.tagNames() : [],
      creationDate: safeDate(todo, 'creationDate'),
      modificationDate: safeDate(todo, 'modificationDate'),
      completionDate: safeDate(todo, 'completionDate')
    }));
    
    return JSON.stringify({
      success: true,
      data: todoData
    });`);
  }

  /**
   * Get items with specific tag
   */
  static getTaggedItems(tagName) {
    return this.wrapScript(`
    const allTodos = things.toDos();
    const allProjects = things.projects();
    
    const taggedTodos = allTodos.filter(todo => {
      const tags = todo.tagNames ? todo.tagNames() : [];
      return tags.includes(params.tag_title);
    });
    
    const taggedProjects = allProjects.filter(project => {
      const tags = project.tagNames ? project.tagNames() : [];
      return tags.includes(params.tag_title);
    });
    
    const todoData = taggedTodos.map(todo => ({
      type: 'todo',
      id: todo.id(),
      name: todo.name(),
      status: todo.status()
    }));
    
    const projectData = taggedProjects.map(project => ({
      type: 'project',
      id: project.id(),
      name: project.name(),
      status: project.status()
    }));
    
    return JSON.stringify({
      success: true,
      data: [...todoData, ...projectData]
    });`);
  }

  /**
   * Search all items (todos, projects, areas)
   */
  static searchItems(query) {
    return this.wrapScript(`
    const searchQuery = params.query.toLowerCase();
    const results = [];
    
    // Search todos
    const todos = things.toDos();
    todos.forEach(todo => {
      const name = todo.name().toLowerCase();
      const notes = todo.notes ? todo.notes().toLowerCase() : '';
      if (name.includes(searchQuery) || notes.includes(searchQuery)) {
        results.push({
          type: 'todo',
          id: todo.id(),
          name: todo.name(),
          status: todo.status()
        });
      }
    });
    
    // Search projects
    const projects = things.projects();
    projects.forEach(project => {
      const name = project.name().toLowerCase();
      const notes = project.notes ? project.notes().toLowerCase() : '';
      if (name.includes(searchQuery) || notes.includes(searchQuery)) {
        results.push({
          type: 'project',
          id: project.id(),
          name: project.name(),
          status: project.status()
        });
      }
    });
    
    // Search areas
    const areas = things.areas();
    areas.forEach(area => {
      const name = area.name().toLowerCase();
      if (name.includes(searchQuery)) {
        results.push({
          type: 'area',
          id: area.id(),
          name: area.name()
        });
      }
    });
    
    return JSON.stringify({
      success: true,
      data: results
    });`);
  }

  /**
   * Show details of a specific item
   */
  static showItem() {
    return this.wrapScript(`
    const itemId = params.id;
    let item = null;
    let itemType = null;
    
    // Try to find as todo
    try {
      item = things.toDos.byId(itemId);
      itemType = 'todo';
    } catch (e) {
      // Not a todo
    }
    
    // Try to find as project
    if (!item) {
      try {
        item = things.projects.byId(itemId);
        itemType = 'project';
      } catch (e) {
        // Not a project
      }
    }
    
    // Try to find as area
    if (!item) {
      try {
        item = things.areas.byId(itemId);
        itemType = 'area';
      } catch (e) {
        // Not an area
      }
    }
    
    if (!item) {
      return JSON.stringify({
        success: false,
        error: {
          type: 'NotFound',
          message: 'Item not found',
          code: -1
        }
      });
    }
    
    // Build response based on item type
    const data = {
      type: itemType,
      id: item.id(),
      name: item.name()
    };
    
    if (itemType !== 'area') {
      data.notes = item.notes ? item.notes() : '';
      data.status = item.status();
      data.tags = item.tagNames ? item.tagNames() : [];
      
      if (item.dueDate) {
        data.dueDate = safeDate(item, 'dueDate');
      }
      
      if (item.activationDate) {
        data.when = safeDate(item, 'activationDate');
      }
      
      if (item.creationDate) {
        data.creationDate = safeDate(item, 'creationDate');
      }
      
      if (item.modificationDate) {
        data.modificationDate = safeDate(item, 'modificationDate');
      }
    }
    
    if (itemType === 'todo') {
      data.project = item.project() ? {
        id: item.project().id(),
        name: item.project().name()
      } : null;
      
      data.area = item.area() ? {
        id: item.area().id(),
        name: item.area().name()
      } : null;
      
      if (item.completionDate) {
        data.completionDate = safeDate(item, 'completionDate');
      }
    }
    
    if (itemType === 'project') {
      data.area = item.area() ? {
        id: item.area().id(),
        name: item.area().name()
      } : null;
      
      data.todos = item.toDos().length;
    }
    
    if (itemType === 'area') {
      data.projects = item.projects().length;
      data.todos = item.toDos().length;
    }
    
    return JSON.stringify({
      success: true,
      data: data
    });`);
  }
}