/**
 * Utility functions for content scripts
 */

/**
 * Generate a unique ID for a message element
 * @param {Element} messageElement - The message DOM element
 * @param {string} prefix - Optional prefix for the ID
 * @returns {string} A unique ID
 */
export function generateMessageId(messageElement, prefix = 'msg') {
  // Try to get existing ID first
  const existingId = messageElement.id || messageElement.dataset.messageId;
  if (existingId) return existingId;
  
  // Generate hash from content
  const content = messageElement.textContent.trim();
  const hash = hashString(content);
  const timestamp = Date.now();
  
  return `${prefix}-${hash}-${timestamp}`;
}

/**
 * Simple string hashing function
 * @param {string} str - String to hash
 * @returns {string} Hash value as hex string
 */
function hashString(str) {
  let hash = 0;
  if (str.length === 0) return hash.toString(16);
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash).toString(16).substring(0, 8);
}

/**
 * Highlight a message element temporarily
 * @param {Element} element - The element to highlight
 * @param {string} color - Highlight color
 * @param {number} duration - Duration in milliseconds
 */
export function highlightElement(element, color = '#ffff99', duration = 2000) {
  if (!element) return;
  
  // Save original background
  const originalBackground = element.style.backgroundColor;
  const originalTransition = element.style.transition;
  
  // Apply highlight
  element.style.transition = 'background-color 0.3s ease';
  element.style.backgroundColor = color;
  
  // Scroll element into view
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  
  // Reset after duration
  setTimeout(() => {
    element.style.backgroundColor = originalBackground;
    element.style.transition = originalTransition;
  }, duration);
}