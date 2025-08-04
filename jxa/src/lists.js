/**
 * List operations for Things 3 (Inbox, Today, etc.)
 */

import { mapTodo, safeGetList, LIST_IDS } from './utils.js';

export class ListOperations {
  
  /**
   * Get inbox todos
   */
  static getInbox(things, params) {
    const inbox = safeGetList(things, LIST_IDS.INBOX);
    return inbox.map(mapTodo);
  }
  
  /**
   * Get today todos
   */
  static getToday(things, params) {
    const today = safeGetList(things, LIST_IDS.TODAY);
    return today.map(mapTodo);
  }
  
  /**
   * Get upcoming todos
   */
  static getUpcoming(things, params) {
    const upcoming = safeGetList(things, LIST_IDS.UPCOMING);
    return upcoming.map(mapTodo);
  }
  
  /**
   * Get anytime todos
   */
  static getAnytime(things, params) {
    const anytime = safeGetList(things, LIST_IDS.ANYTIME);
    return anytime.map(mapTodo);
  }
  
  /**
   * Get someday todos
   */
  static getSomeday(things, params) {
    const someday = safeGetList(things, LIST_IDS.SOMEDAY);
    return someday.map(mapTodo);
  }
  
  /**
   * Get logbook (completed items)
   */
  static getLogbook(things, params) {
    const logbook = safeGetList(things, LIST_IDS.LOGBOOK);
    
    // Apply period filter if specified
    let filtered = logbook;
    if (params.period) {
      const match = params.period.match(/^(\d+)([dwmy])$/);
      if (match) {
        const amount = parseInt(match[1]);
        const unit = match[2];
        
        const cutoffDate = new Date();
        switch (unit) {
          case 'd': cutoffDate.setDate(cutoffDate.getDate() - amount); break;
          case 'w': cutoffDate.setDate(cutoffDate.getDate() - (amount * 7)); break;
          case 'm': cutoffDate.setMonth(cutoffDate.getMonth() - amount); break;
          case 'y': cutoffDate.setFullYear(cutoffDate.getFullYear() - amount); break;
        }
        
        filtered = logbook.filter(todo => {
          try {
            const completionDate = todo.completionDate();
            return completionDate && completionDate >= cutoffDate;
          } catch (e) {
            return false;
          }
        });
      }
    }
    
    // Apply limit
    const limit = params.limit || 100;
    const limited = filtered.slice(0, limit);
    
    return limited.map(mapTodo);
  }
  
  /**
   * Get trash
   */
  static getTrash(things, params) {
    const trash = safeGetList(things, LIST_IDS.TRASH);
    return trash.map(mapTodo);
  }
}