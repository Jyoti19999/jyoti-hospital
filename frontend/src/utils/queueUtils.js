// src/utils/queueUtils.js

/**
 * Helper function to check if a note is a queue management system note
 * These are automatically generated notes from drag-and-drop operations
 * that should not be displayed to end users in the UI
 */
export const isQueueManagementNote = (note) => {
  if (!note) return false;
  
  // Check if it's JSON containing receptionist2Review (system data that shouldn't be displayed)
  try {
    const parsed = JSON.parse(note);
    if (parsed.receptionist2Review) {
      return true; // This is system data, don't display it
    }
  } catch (e) {
    // Not JSON, continue with other checks
  }
  
  const queueManagementPatterns = [
    /Queue reordered.*position.*to/i,
    /Moved to position/i,
    /Shifted from.*to/i,
    /Active patient repositioned from/i,
    /Position changed from.*to/i,
    /Patient moved from position.*via drag and drop/i,
    /Comprehensive reordering with intelligent shifting/i,
    /Direct queue reorder via drag and drop/i
  ];
  
  return queueManagementPatterns.some(pattern => pattern.test(note));
};

/**
 * Filter out queue management notes from patient notes for display
 */
export const getDisplayableNotes = (notes) => {
  if (!notes) return null;
  return isQueueManagementNote(notes) ? null : notes;
};