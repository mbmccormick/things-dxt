/**
 * AppleScript Templates for Things 3 Integration
 * 
 * This module contains all AppleScript templates used to interact with Things 3.
 * Key principles:
 * - Each template handles Things 3's internal date terminology (due_date = deadline, activation_date = when scheduled)
 * - Robust error handling with try/catch blocks for optional properties
 * - Consistent output format for data parsing
 * - Safe parameter templating to prevent injection
 */

export class AppleScriptTemplates {
  
  /**
   * Check if Things 3 is running
   */
  static isThingsRunning() {
    return `tell application "System Events" to (name of processes) contains "Things3"`;
  }

  /**
   * Create a new to-do item
   */
  static createTodo({ name, notes, due_date, activation_date, project, area, tags }) {
    let script = `tell application "Things3"
      set newTodo to make new to do with properties {name: "{{name}}"`;
    
    if (notes) {
      script += `, notes: "{{notes}}"`;
    }
    
    if (due_date) {
      // Convert YYYY-MM-DD to AppleScript-friendly format
      script += `, due date: date "{{due_date_formatted}}"`;
    }
    
    // Note: activation_date will be set after creation using schedule command
    
    script += `}`;
    
    if (project) {
      script += `
      try
        set targetProject to first project whose name is "{{project}}"
        move newTodo to targetProject
      on error
        -- Project not found, leave todo in inbox
      end try`;
    } else if (area) {
      script += `
      try
        set targetArea to first area whose name is "{{area}}"
        move newTodo to targetArea
      on error
        -- Area not found, leave todo in inbox
      end try`;
    }
    
    if (tags && tags.length > 0) {
      // Build tag list with sanitized tag names (handled by AppleScriptSanitizer)
      const tagPlaceholders = tags.map((_, index) => `"{{tag_${index}}}"`).join(", ");
      script += `
      try
        set tag names of newTodo to {${tagPlaceholders}}
      on error
        -- Tags assignment failed, continue without tags
      end try`;
    }
    
    // Schedule the todo if activation_date is provided
    if (activation_date) {
      script += `
      try
        schedule newTodo for date "{{activation_date_formatted}}"
      on error
        -- Scheduling failed, continue without scheduling
      end try`;
    }
    
    script += `
      return id of newTodo
    end tell`;
    
    return script;
  }

  /**
   * Create a new project
   */
  static createProject({ name, notes, area, due_date, activation_date, tags }) {
    let script = `tell application "Things3"
      set newProject to make new project with properties {name: "{{name}}"`;
    
    if (notes) {
      script += `, notes: "{{notes}}"`;
    }
    
    if (due_date) {
      // Convert YYYY-MM-DD to AppleScript-friendly format
      script += `, due date: date "{{due_date_formatted}}"`;
    }
    
    // Note: activation_date will be set after creation using schedule command
    
    script += `}`;
    
    if (area) {
      script += `
      try
        set targetArea to first area whose name is "{{area}}"
        move newProject to targetArea
      on error
        -- Area not found, leave project without area assignment
      end try`;
    }
    
    if (tags && tags.length > 0) {
      const tagPlaceholders = tags.map((_, index) => `"{{tag_${index}}}"`).join(", ");
      script += `
      try
        set tag names of newProject to {${tagPlaceholders}}
      on error
        -- Tags assignment failed, continue without tags
      end try`;
    }
    
    // Schedule the project if activation_date is provided
    if (activation_date) {
      script += `
      try
        schedule newProject for date "{{activation_date_formatted}}"
      on error
        -- Scheduling failed, continue without scheduling
      end try`;
    }
    
    script += `
      return id of newProject
    end tell`;
    
    return script;
  }

  /**
   * Create a new area
   */
  static createArea({ name, tags }) {
    let script = `tell application "Things3"
      set newArea to make new area with properties {name: "{{name}}"}`;
    
    if (tags && tags.length > 0) {
      const tagPlaceholders = tags.map((_, index) => `"{{tag_${index}}}"`).join(", ");
      script += `
      try
        set tag names of newArea to {${tagPlaceholders}}
      on error
        -- Tags assignment failed, continue without tags
      end try`;
    }
    
    script += `
      return id of newArea
    end tell`;
    
    return script;
  }



  /**
   * Get areas
   */
  static getAreas() {
    return `tell application "Things3"
      set areaList to areas
      set output to ""
      repeat with a in areaList
        set output to output & (id of a) & tab & (name of a) & tab
        
        try
          set projectCount to count of projects of a
          set output to output & projectCount & tab
        on error
          set output to output & "0" & tab
        end try
        
        try
          set todoCount to count of to dos of a
          set output to output & todoCount & tab
        on error
          set output to output & "0" & tab
        end try
        
        try
          set tagList to tag names of a
          set tagString to ""
          repeat with i from 1 to count of tagList
            set tagString to tagString & (item i of tagList)
            if i < count of tagList then set tagString to tagString & ","
          end repeat
          set output to output & tagString
        on error
          set output to output & ""
        end try
        
        set output to output & linefeed
      end repeat
      return output
    end tell`;
  }

  /**
   * Update a todo by ID or name
   */
  static updateTodo({ id, name, title, new_name, notes, due_date, activation_date, project, area, tags, completed, canceled }) {
    const nameToUpdate = title || new_name;
    
    let script = `tell application "Things3"
      try
        set targetTodo to ${id ? 'to do id "{{id}}"' : 'first to do whose name is "{{name}}"'}`;
    
    // Update name/title if provided
    if (nameToUpdate) {
      script += `
        set name of targetTodo to "{{title}}"`;
    }
    
    // Update notes if provided
    if (notes) {
      script += `
        set notes of targetTodo to "{{notes}}"`;
    }
    
    // Update due date (deadline) if provided
    if (due_date) {
      script += `
        set due date of targetTodo to date "{{due_date_formatted}}"`;
    }
    
    // Update activation date (when scheduled) if provided
    if (activation_date) {
      script += `
        schedule targetTodo for date "{{activation_date_formatted}}"`;
    }
    
    // Update status if provided
    if (completed !== undefined) {
      script += `
        set status of targetTodo to ${completed ? 'completed' : 'open'}`;
    }
    
    if (canceled !== undefined) {
      script += `
        set status of targetTodo to ${canceled ? 'canceled' : 'open'}`;
    }
    
    // Update tags if provided
    if (tags !== undefined && tags !== null) {
      if (!Array.isArray(tags)) {
        throw new Error('tags parameter must be an array');
      }
      if (tags.length > 0) {
        const tagPlaceholders = tags.map((_, index) => `"{{tag_${index}}}"`).join(", ");
        script += `
        try
          set tag names of targetTodo to {${tagPlaceholders}}
        on error
          -- Tags assignment failed, continue without tags
        end try`;
      } else {
        // Empty array means remove all tags
        script += `
        try
          set tag names of targetTodo to {}
        on error
          -- Tags removal failed, continue
        end try`;
      }
    }
    
    // Move to project if provided
    if (project) {
      script += `
        try
          set targetProject to first project whose name is "{{project}}"
          move targetTodo to targetProject
        on error
          -- Project not found, leave todo in current location
        end try`;
    } else if (area) {
      // Move to area if provided (only if no project specified)
      script += `
        try
          set targetArea to first area whose name is "{{area}}"
          move targetTodo to targetArea
        on error
          -- Area not found, leave todo in current location
        end try`;
    }
    
    script += `
        return "updated"
      on error
        return "not_found"
      end try
    end tell`;
    
    return script;
  }

  /**
   * Update a project by ID or name
   */
  static updateProject({ id, name, title, notes, due_date, activation_date, area, tags, completed, canceled }) {
    const nameToUpdate = title;
    
    let script = `tell application "Things3"
      try
        set targetProject to ${id ? 'project id "{{id}}"' : 'first project whose name is "{{name}}"'}`;
    
    // Update name/title if provided
    if (nameToUpdate) {
      script += `
        set name of targetProject to "{{title}}"`;
    }
    
    // Update notes if provided
    if (notes) {
      script += `
        set notes of targetProject to "{{notes}}"`;
    }
    
    // Update due date (deadline) if provided
    if (due_date) {
      script += `
        set due date of targetProject to date "{{due_date_formatted}}"`;
    }
    
    // Update activation date (when scheduled) if provided
    if (activation_date) {
      script += `
        schedule targetProject for date "{{activation_date_formatted}}"`;
    }
    
    // Update status if provided
    if (completed !== undefined) {
      script += `
        set status of targetProject to ${completed ? 'completed' : 'open'}`;
    }
    
    if (canceled !== undefined) {
      script += `
        set status of targetProject to ${canceled ? 'canceled' : 'open'}`;
    }
    
    // Update tags if provided
    if (tags !== undefined && tags !== null) {
      if (!Array.isArray(tags)) {
        throw new Error('tags parameter must be an array');
      }
      if (tags.length > 0) {
        const tagPlaceholders = tags.map((_, index) => `"{{tag_${index}}}"`).join(", ");
        script += `
        try
          set tag names of targetProject to {${tagPlaceholders}}
        on error
          -- Tags assignment failed, continue without tags
        end try`;
      } else {
        // Empty array means remove all tags
        script += `
        try
          set tag names of targetProject to {}
        on error
          -- Tags removal failed, continue
        end try`;
      }
    }
    
    // Move to area if provided
    if (area) {
      script += `
        try
          set targetArea to first area whose name is "{{area}}"
          move targetProject to targetArea
        on error
          -- Area not found, leave project in current location
        end try`;
    }
    
    script += `
        return "updated"
      on error
        return "not_found"
      end try
    end tell`;
    
    return script;
  }


  /**
   * Change status of an item (todo or project)
   */
  static changeItemStatus(itemType, newStatus) {
    const itemSelector = itemType === "to-do" ? "to do" : itemType;
    
    return `tell application "Things3"
      try
        set targetItem to first ${itemSelector} whose name is "{{name}}"
        set status of targetItem to ${newStatus}
        return "${newStatus}"
      on error
        return "not_found"
      end try
    end tell`;
  }

  /**
   * Delete an item by name (todo, project, or area)
   */
  static deleteItem(itemType) {
    const itemSelector = itemType === "to-do" ? "to do" : itemType;
    
    return `tell application "Things3"
      try
        set targetItem to first ${itemSelector} whose name is "{{name}}"
        delete targetItem
        return "deleted"
      on error
        return "not_found"
      end try
    end tell`;
  }

  /**
   * Delete an area by name (legacy - use deleteItem instead)
   */
  static deleteArea(name) {
    return this.deleteItem("area");
  }

  /**
   * Generic function to get items by status (todos or projects)
   */
  static getItemsByStatus(itemType, status, listName = null, areaName = null) {
    const statusFilter = this.getStatusFilter(status);
    
    let itemSelector;
    if (itemType === "todos") {
      itemSelector = listName && listName !== "all" ? `to dos of list "${listName}"` : "to dos";
    } else {
      itemSelector = areaName ? `projects of area "${areaName}"` : "projects";
    }
    
    const isProject = itemType === "projects";
    const itemVar = isProject ? "p" : "t";
    
    return `tell application "Things3"
      try
        set itemList to ${itemSelector} whose ${statusFilter}
      on error
        set itemList to {}
      end try
      
      set output to ""
      repeat with ${itemVar} in itemList
        set output to output & (id of ${itemVar}) & tab & (name of ${itemVar}) & tab
        
        -- Get notes (handle missing value)
        try
          set output to output & (notes of ${itemVar}) & tab
        on error
          set output to output & tab
        end try
        
        -- Get due date (handle missing value)
        try
          set output to output & (due date of ${itemVar} as string) & tab
        on error
          set output to output & tab
        end try
        
        -- Get activation date (handle missing value)
        try
          set output to output & (activation date of ${itemVar} as string) & tab
        on error
          set output to output & tab
        end try
        
        -- Get status
        set output to output & (status of ${itemVar} as string) & tab
        
        -- Get creation date
        try
          set output to output & (creation date of ${itemVar} as string) & tab
        on error
          set output to output & tab
        end try
        
        -- Get modification date
        try
          set output to output & (modification date of ${itemVar} as string) & tab
        on error
          set output to output & tab
        end try
        
        -- Get completion date
        try
          set output to output & (completion date of ${itemVar} as string) & tab
        on error
          set output to output & tab
        end try
        
        ${isProject ? this.getProjectSpecificFields(itemVar) : this.getTodoSpecificFields(itemVar)}
        
        set output to output & linefeed
      end repeat
      return output
    end tell`;
  }

  /**
   * Get status filter for AppleScript
   */
  static getStatusFilter(status) {
    switch(status) {
      case "open":
        return "status is open";
      case "completed":
        return "status is completed";
      case "canceled":
        return "status is canceled";
      default:
        return "status is open";
    }
  }

  /**
   * Get project-specific fields for AppleScript output
   */
  static getProjectSpecificFields(itemVar) {
    return `-- Get area name
        try
          set parentArea to area of ${itemVar}
          if parentArea is not missing value then
            set output to output & (name of parentArea) & tab
          else
            set output to output & tab
          end if
        on error
          set output to output & tab
        end try
        
        -- Get todo count
        try
          set todoCount to count of to dos of ${itemVar}
          set output to output & todoCount & tab
        on error
          set output to output & "0" & tab
        end try
        
        -- Get tags (as comma-separated string)
        try
          set tagList to tag names of ${itemVar}
          set tagString to ""
          repeat with i from 1 to count of tagList
            set tagString to tagString & (item i of tagList)
            if i < count of tagList then set tagString to tagString & ","
          end repeat
          set output to output & tagString
        on error
          set output to output & ""
        end try`;
  }

  /**
   * Get todo-specific fields for AppleScript output
   */
  static getTodoSpecificFields(itemVar) {
    return `-- Get project name
        try
          set parentProject to project of ${itemVar}
          if parentProject is not missing value then
            set output to output & (name of parentProject) & tab
          else
            set output to output & tab
          end if
        on error
          set output to output & tab
        end try
        
        -- Get area name
        try
          set parentArea to area of ${itemVar}
          if parentArea is not missing value then
            set output to output & (name of parentArea) & tab
          else
            set output to output & tab
          end if
        on error
          set output to output & tab
        end try
        
        -- Get tags (as comma-separated string)
        try
          set tagList to tag names of ${itemVar}
          set tagString to ""
          repeat with i from 1 to count of tagList
            set tagString to tagString & (item i of tagList)
            if i < count of tagList then set tagString to tagString & ","
          end repeat
          set output to output & tagString
        on error
          set output to output & ""
        end try`;
  }

  /**
   * Search for todos
   */
  static searchTodos(query) {
    return `tell application "Things3"
      set foundTodos to to dos whose name contains "{{query}}"
      set output to ""
      repeat with t in foundTodos
        set output to output & "todo" & tab & (id of t) & tab & (name of t) & tab
        
        try
          set noteText to notes of t
          -- Simple replacement of line breaks with spaces
          set originalDelimiter to AppleScript's text item delimiters
          set AppleScript's text item delimiters to return
          set noteItems to text items of noteText
          set AppleScript's text item delimiters to " "
          set noteText to noteItems as string
          set AppleScript's text item delimiters to linefeed
          set noteItems to text items of noteText
          set AppleScript's text item delimiters to " "
          set noteText to noteItems as string
          set AppleScript's text item delimiters to originalDelimiter
          set output to output & noteText & tab
        on error
          set output to output & tab
        end try
        
        try
          set output to output & (due date of t as string) & tab
        on error
          set output to output & tab
        end try
        
        try
          set output to output & (activation date of t as string) & tab
        on error
          set output to output & tab
        end try
        
        set output to output & (status of t as string) & tab
        
        try
          set parentProject to project of t
          if parentProject is not missing value then
            set output to output & (name of parentProject) & tab
          else
            set output to output & tab
          end if
        on error
          set output to output & tab
        end try
        
        try
          set parentArea to area of t
          if parentArea is not missing value then
            set output to output & (name of parentArea)
          else
            set output to output & ""
          end if
        on error
          set output to output & ""
        end try
        
        set output to output & linefeed
      end repeat
      return output
    end tell`;
  }

  /**
   * Search for projects
   */
  static searchProjects(query) {
    return `tell application "Things3"
      set foundProjects to projects whose name contains "{{query}}"
      set output to ""
      repeat with p in foundProjects
        set output to output & "project" & tab & (id of p) & tab & (name of p) & tab
        
        try
          set noteText to notes of p
          -- Replace line breaks with space to prevent parsing issues
          set noteText to my replaceText(noteText, return, " ")
          set noteText to my replaceText(noteText, linefeed, " ")
          set output to output & noteText & tab
        on error
          set output to output & tab
        end try
        
        try
          set output to output & (due date of p as string) & tab
        on error
          set output to output & tab
        end try
        
        try
          set output to output & (activation date of p as string) & tab
        on error
          set output to output & tab
        end try
        
        set output to output & (status of p as string) & tab
        
        try
          set parentArea to area of p
          if parentArea is not missing value then
            set output to output & (name of parentArea)
          else
            set output to output & ""
          end if
        on error
          set output to output & ""
        end try
        
        set output to output & linefeed
      end repeat
      return output
      
      on replaceText(theText, searchString, replacementString)
        set AppleScript's text item delimiters to searchString
        set theTextItems to text items of theText
        set AppleScript's text item delimiters to replacementString
        set theText to theTextItems as string
        set AppleScript's text item delimiters to ""
        return theText
      end replaceText
    end tell`;
  }

  /**
   * Search for areas
   */
  static searchAreas(query) {
    return `tell application "Things3"
      set foundAreas to areas whose name contains "{{query}}"
      set output to ""
      repeat with a in foundAreas
        set output to output & "area" & tab & (id of a) & tab & (name of a) & linefeed
      end repeat
      return output
    end tell`;
  }

  /**
   * Get all tags
   */
  static getTags() {
    return `tell application "Things3"
      set tagList to {}
      repeat with aTag in tags
        set end of tagList to name of aTag
      end repeat
      return my listToString(tagList)
    end tell
    
    on listToString(lst)
      set AppleScript's text item delimiters to "\\n"
      set theString to lst as string
      set AppleScript's text item delimiters to ""
      return theString
    end listToString`;
  }

  /**
   * Get upcoming todos with date filtering
   */
  static getUpcomingTodos(days = 7, includeCompleted = false) {
    const completedFilter = includeCompleted ? '' : ' whose status is not completed';
    
    return `tell application "Things3"
      set today to (current date)
      set time of today to 0
      set futureDate to today + (${days} * days)
      
      set allTodos to to dos${completedFilter}
      set todoList to {}
      repeat with t in allTodos
        try
          set activationDate to activation date of t
          if activationDate is not missing value and activationDate ≥ today and activationDate ≤ futureDate then
            set end of todoList to t
          end if
        end try
      end repeat
      set output to ""
      repeat with t in todoList
        set output to output & (id of t) & tab & (name of t) & tab
        
        -- Get notes (handle missing value)
        try
          set output to output & (notes of t) & tab
        on error
          set output to output & tab
        end try
        
        -- Get due date (handle missing value)
        try
          set output to output & (due date of t as string) & tab
        on error
          set output to output & tab
        end try
        
        -- Get activation date (handle missing value)
        try
          set output to output & (activation date of t as string) & tab
        on error
          set output to output & tab
        end try
        
        -- Get status
        set output to output & (status of t as string) & tab
        
        -- Get creation date
        try
          set output to output & (creation date of t as string) & tab
        on error
          set output to output & tab
        end try
        
        -- Get modification date
        try
          set output to output & (modification date of t as string) & tab
        on error
          set output to output & tab
        end try
        
        -- Get completion date
        try
          set output to output & (completion date of t as string) & tab
        on error
          set output to output & tab
        end try
        
        -- Get project name
        try
          set parentProject to project of t
          if parentProject is not missing value then
            set output to output & (name of parentProject) & tab
          else
            set output to output & tab
          end if
        on error
          set output to output & tab
        end try
        
        -- Get area name
        try
          set parentArea to area of t
          if parentArea is not missing value then
            set output to output & (name of parentArea) & tab
          else
            set output to output & tab
          end if
        on error
          set output to output & tab
        end try
        
        -- Get tags (as comma-separated string)
        try
          set tagList to tag names of t
          set tagString to ""
          repeat with i from 1 to count of tagList
            set tagString to tagString & (item i of tagList)
            if i < count of tagList then set tagString to tagString & ","
          end repeat
          set output to output & tagString
        on error
          set output to output & ""
        end try
        
        set output to output & linefeed
      end repeat
      return output
    end tell`;
  }
}