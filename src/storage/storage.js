/**
 * Message storage management system
 */

/**
 * Save tracked messages for a chat
 * @param {string} chatId - The chat identifier
 * @param {Array} messages - Array of message objects
 * @returns {Promise} Promise resolving when storage is complete
 */
export function saveMessages(chatId, messages) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['chats'], (result) => {
      const chats = result.chats || {};
      
      // Update or add chat messages
      chats[chatId] = {
        lastUpdated: Date.now(),
        messages: messages
      };
      
      chrome.storage.local.set({ chats }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  });
}

/**
 * Get all messages for a specific chat
 * @param {string} chatId - The chat identifier
 * @returns {Promise<Array>} Promise resolving to array of messages
 */
export function getMessages(chatId) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['chats'], (result) => {
      const chats = result.chats || {};
      const chatData = chats[chatId] || { messages: [] };
      
      resolve(chatData.messages);
    });
  });
}

/**
 * Get all tracked chats
 * @returns {Promise<Object>} Promise resolving to object of all chats
 */
export function getAllChats() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['chats'], (result) => {
      resolve(result.chats || {});
    });
  });
}

/**
 * Delete a chat and all its messages
 * @param {string} chatId - The chat identifier
 * @returns {Promise} Promise resolving when deletion is complete
 */
export function deleteChat(chatId) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['chats'], (result) => {
      const chats = result.chats || {};
      
      if (chats[chatId]) {
        delete chats[chatId];
        
        chrome.storage.local.set({ chats }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      } else {
        resolve(); // Nothing to delete
      }
    });
  });
}