/**
 * Tag operations for Things 3
 */

import { mapTodo, parseTags } from './utils.js';

export class TagOperations {
  
  /**
   * Get all tags
   */
  static getAll(things, params) {
    try {
      const tags = things.tags();
      return tags.map(tag => tag.name());
    } catch (e) {
      return [];
    }
  }
  
  /**
   * Get items with a specific tag
   */
  static getTaggedItems(things, params) {
    const tagName = params.tag_title;
    
    let allTodos;
    try {
      allTodos = things.toDos();
    } catch (e) {
      return [];
    }
    
    const tagged = allTodos.filter(todo => {
      try {
        const tagNames = todo.tagNames() || '';
        const tags = parseTags(tagNames);
        return tags.includes(tagName);
      } catch (e) {
        return false;
      }
    });
    
    return tagged.map(mapTodo);
  }
}