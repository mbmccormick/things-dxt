/**
 * Response formatting utilities
 */

export class ResponseFormatter {
  static createSuccessResponse(data) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2)
        }
      ]
    };
  }
  
  static createErrorResponse(message, code = 'UNKNOWN_ERROR') {
    const errorData = {
      success: false,
      error: {
        message: message,
        code: code
      }
    };
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(errorData, null, 2)
        }
      ]
    };
  }
  
  static formatTodoResponse(todo) {
    return {
      id: todo.id,
      name: todo.name,
      status: todo.status,
      notes: todo.notes || '',
      tags: todo.tags || [],
      dueDate: todo.dueDate,
      when: todo.when,
      project: todo.project,
      area: todo.area,
      checklistItems: todo.checklistItems || []
    };
  }
  
  static formatProjectResponse(project) {
    return {
      id: project.id,
      name: project.name,
      status: project.status,
      notes: project.notes || '',
      tags: project.tags || [],
      deadline: project.deadline,
      when: project.when,
      area: project.area
    };
  }
}