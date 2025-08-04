/**
 * Common utilities for JXA Things operations
 */

/**
 * Parse a date string (YYYY-MM-DD) to a Date object at midnight in system timezone
 * This ensures the date represents the start of the specified day in local time
 */
export function parseLocalDate(dateString) {
  if (!dateString) return null;
  
  // Parse the date components
  const [year, month, day] = dateString.split('-').map(Number);
  
  // Create date in local timezone (month is 0-indexed in JS)
  // This ensures we get midnight on the specified date in the system timezone
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

/**
 * Safe date extraction from Things objects
 */
export function getDate(item, method) {
  try {
    const date = item[method]();
    if (!date) return null;
    
    // Return ISO string in UTC (standard format)
    // The date object from Things already represents the correct local date
    return date.toISOString();
  } catch (e) {
    return null;
  }
}

/**
 * Schedule item for a specific date using Things schedule command
 */
export function scheduleItem(things, item, dateString) {
  if (!dateString) return;
  try {
    // Parse date properly in local timezone
    const date = parseLocalDate(dateString);
    if (date) {
      things.schedule(item, { for: date });
    }
  } catch (e) {
    // Scheduling failed - activation date is read-only in API
    // No fallback possible since activationDate property is read-only
  }
}

/**
 * Convert tags array to comma-separated string (Things API format)
 */
export function formatTags(tags) {
  if (!tags || !Array.isArray(tags) || tags.length === 0) {
    return '';
  }
  return tags.join(', ');
}

/**
 * Parse comma-separated tag string to array
 */
export function parseTags(tagString) {
  if (!tagString || typeof tagString !== 'string') {
    return [];
  }
  return tagString.split(',').map(t => t.trim()).filter(t => t);
}


/**
 * Map todo object to response format
 */
export function mapTodo(todo) {
  const result = {
    id: todo.id(),
    name: todo.name(),
    status: todo.status(),
    notes: todo.notes() || '',
    tagNames: todo.tagNames() || '',  // Return as string per SDEF
    tags: parseTags(todo.tagNames()), // Also return as array for convenience
    deadline: getDate(todo, 'dueDate'),        // User-friendly: when actually due
    when: getDate(todo, 'activationDate'),     // User-friendly: when scheduled to work on
    creationDate: getDate(todo, 'creationDate'),
    modificationDate: getDate(todo, 'modificationDate'),
    completionDate: getDate(todo, 'completionDate'),
    cancellationDate: getDate(todo, 'cancellationDate')
  };
  
  // Add project info if exists
  try {
    const project = todo.project();
    if (project) {
      result.project = {
        id: project.id(),
        name: project.name()
      };
    }
  } catch (e) {
    result.project = null;
  }
  
  // Add area info if exists
  try {
    const area = todo.area();
    if (area) {
      result.area = {
        id: area.id(),
        name: area.name()
      };
    }
  } catch (e) {
    result.area = null;
  }
  
  
  return result;
}

/**
 * Map project object to response format
 */
export function mapProject(project) {
  const result = {
    id: project.id(),
    name: project.name(),
    status: project.status(),
    notes: project.notes() || '',
    tagNames: project.tagNames() || '',  // Return as string per SDEF
    tags: parseTags(project.tagNames()), // Also return as array for convenience
    deadline: getDate(project, 'dueDate'),        // User-friendly: when actually due
    when: getDate(project, 'activationDate'),     // User-friendly: when scheduled to work on
    creationDate: getDate(project, 'creationDate'),
    modificationDate: getDate(project, 'modificationDate'),
    completionDate: getDate(project, 'completionDate'),
    cancellationDate: getDate(project, 'cancellationDate')
  };
  
  // Add area info if exists
  try {
    const area = project.area();
    if (area) {
      result.area = {
        id: area.id(),
        name: area.name()
      };
    }
  } catch (e) {
    result.area = null;
  }
  
  // Add child tasks (projects can have child todos)
  try {
    const childTasks = project.toDos();
    if (childTasks && childTasks.length > 0) {
      result.childTasks = childTasks.map(child => ({
        id: child.id(),
        name: child.name(),
        status: child.status(),
        completed: child.status() === 'completed'
      }));
    } else {
      result.childTasks = [];
    }
  } catch (e) {
    result.childTasks = [];
  }
  
  return result;
}

/**
 * Map area object to response format
 */
export function mapArea(area) {
  return {
    id: area.id(),
    name: area.name(),
    tagNames: area.tagNames() || '',  // Return as string per SDEF
    tags: parseTags(area.tagNames()), // Also return as array for convenience
    collapsed: area.collapsed()
  };
}

/**
 * Get list by ID with error handling
 */
export function safeGetList(things, listId) {
  try {
    return things.lists.byId(listId).toDos();
  } catch (e) {
    return [];
  }
}

/**
 * Things list IDs constants
 */
export const LIST_IDS = {
  INBOX: "TMInboxListSource",
  TODAY: "TMTodayListSource", 
  UPCOMING: "TMCalendarListSource",
  ANYTIME: "TMNextListSource",
  SOMEDAY: "TMSomedayListSource",
  LOGBOOK: "TMLogbookListSource",
  TRASH: "TMTrashListSource"
};