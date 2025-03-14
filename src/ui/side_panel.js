/**
 * Side panel script for AI Chat Navigator extension
 * Displays and manages tracked messages and chats
 */

// Current state
let currentTab = 'messages';
let currentChatId = null;
let currentFilter = 'all';
let allMessages = [];
let allChats = {};

// Initialize when side panel opens
document.addEventListener('DOMContentLoaded', () => {
  setupTabNavigation();
  setupFilterButtons();
  setupSearchBoxes();
  
  // Get active tab and chat
  getCurrentTabInfo().then(tabInfo => {
    if (tabInfo) {
      currentChatId = tabInfo.chatId;
      loadMessages(currentChatId);
    }
    
    // Load all chats regardless
    loadChats();
  });
});

/**
 * Set up tab navigation
 */
function setupTabNavigation() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Update active tab button
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Show corresponding tab content
      const tabName = button.dataset.tab;
      currentTab = tabName;
      
      tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === `${tabName}-tab`) {
          content.classList.add('active');
        }
      });
      
      // Refresh content if needed
      if (tabName === 'messages' && currentChatId) {
        loadMessages(currentChatId);
      } else if (tabName === 'chats') {
        loadChats();
      }
    });
  });
}

/**
 * Set up message filter buttons
 */
function setupFilterButtons() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Update active filter button
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Apply filter
      currentFilter = button.dataset.filter;
      displayMessages(allMessages);
    });
  });
}

/**
 * Set up search boxes
 */
function setupSearchBoxes() {
  const chatSearch = document.getElementById('chat-search');
  chatSearch.addEventListener('input', () => {
    displayChats(chatSearch.value);
  });
}

/**
 * Get information about the current tab
 * @returns {Promise<Object>} Promise resolving to tab info or null
 */
async function getCurrentTabInfo() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) {
        resolve(null);
        return;
      }
      
      const currentTab = tabs[0];
      
      // Get active chat ID for this tab
      chrome.runtime.sendMessage({ 
        action: 'getActiveChat',
        tabId: currentTab.id
      }, (response) => {
        if (response && response.chatId) {
          resolve({
            tabId: currentTab.id,
            chatId: response.chatId
          });
        } else {
          resolve(null);
        }
      });
    });
  });
}

/**
 * Load messages for a specific chat
 * @param {string} chatId - The chat identifier
 */
function loadMessages(chatId) {
  if (!chatId) {
    displayEmptyMessages();
    return;
  }
  
  chrome.runtime.sendMessage({ 
    action: 'getMessages',
    chatId 
  }, (response) => {
    if (response && response.messages) {
      allMessages = response.messages;
      displayMessages(allMessages);
    } else {
      displayEmptyMessages();
    }
  });
}

/**
 * Display messages with optional filtering and search
 * @param {Array} messages - Array of message objects
 * @param {string} searchTerm - Optional search term
 */
function displayMessages(messages, searchTerm = '') {
  const container = document.getElementById('messages-container');
  
  // Filter by type if needed
  let filteredMessages = messages;
  if (currentFilter !== 'all') {
    filteredMessages = messages.filter(msg => msg.type === currentFilter);
  }
  
  // Apply search if provided
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filteredMessages = filteredMessages.filter(msg => 
      msg.content.toLowerCase().includes(term)
    );
  }
  
  // Sort by index (chronological order)
  filteredMessages.sort((a, b) => a.index - b.index);
  
  // Display messages or empty state
  if (filteredMessages.length === 0) {
    if (searchTerm || currentFilter !== 'all') {
      container.innerHTML = `
        <div class="no-results">
          No messages match your criteria.
        </div>
      `;
    } else {
      displayEmptyMessages();
    }
  } else {
    container.innerHTML = `<div class="message-list"></div>`;
    const messageList = container.querySelector('.message-list');
    
    filteredMessages.forEach(message => {
      const messageElement = createMessageElement(message);
      messageList.appendChild(messageElement);
    });
  }
}

/**
 * Create a message element for display
 * @param {Object} message - Message data object
 * @returns {Element} The created message element
 */
function createMessageElement(message) {
  const messageItem = document.createElement('div');
  messageItem.className = 'message-item';
  messageItem.dataset.id = message.id;
  
  // Create color indicator
  const colorIndicator = document.createElement('div');
  colorIndicator.className = 'message-color';
  colorIndicator.style.backgroundColor = message.color || '#ccc';
  
  // Create message content
  const content = document.createElement('div');
  content.className = 'message-content';
  
  const text = document.createElement('div');
  text.className = 'message-text';
  text.textContent = message.content;
  
  const meta = document.createElement('div');
  meta.className = 'message-meta';
  
  const type = document.createElement('span');
  type.className = `message-type ${message.type}`;
  type.textContent = message.type.charAt(0).toUpperCase() + message.type.slice(1);
  
  const time = document.createElement('span');
  time.className = 'message-time';
  time.textContent = formatTime(message.timestamp);
  
  meta.appendChild(type);
  meta.appendChild(time);
  
  content.appendChild(text);
  content.appendChild(meta);
  
  // Add click handler to scroll to message
  messageItem.addEventListener('click', () => {
    scrollToMessage(message.id);
  });
  
  messageItem.appendChild(colorIndicator);
  messageItem.appendChild(content);
  
  return messageItem;
}

/**
 * Display empty messages state
 */
function displayEmptyMessages() {
  const container = document.getElementById('messages-container');
  container.innerHTML = `
    <div class="empty-state">
      No messages tracked yet. Visit a supported AI chat page.
    </div>
  `;
}

/**
 * Load all chats
 */
function loadChats() {
  chrome.runtime.sendMessage({ action: 'getAllChats' }, (response) => {
    if (response && response.chats) {
      allChats = response.chats;
      displayChats();
    } else {
      displayEmptyChats();
    }
  });
}

/**
 * Display chats with optional search
 * @param {string} searchTerm - Optional search term
 */
function displayChats(searchTerm = '') {
  const container = document.getElementById('chats-container');
  const chats = Object.entries(allChats);
  
  // Filter by search term if provided
  let filteredChats = chats;
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filteredChats = chats.filter(([_, chat]) => 
      chat.title.toLowerCase().includes(term) || 
      chat.siteName.toLowerCase().includes(term)
    );
  }
  
  // Sort by last updated (newest first)
  filteredChats.sort((a, b) => b[1].lastUpdated - a[1].lastUpdated);
  
  // Display chats or empty state
  if (filteredChats.length === 0) {
    if (searchTerm) {
      container.innerHTML = `
        <div class="no-results">
          No chats match your search.
        </div>
      `;
    } else {
      displayEmptyChats();
    }
  } else {
    container.innerHTML = `<div class="chat-list"></div>`;
    const chatList = container.querySelector('.chat-list');
    
    filteredChats.forEach(([chatId, chat]) => {
      const chatElement = createChatElement(chatId, chat);
      chatList.appendChild(chatElement);
    });
  }
}

/**
 * Create a chat element for display
 * @param {string} chatId - Chat identifier
 * @param {Object} chat - Chat data object
 * @returns {Element} The created chat element
 */
function createChatElement(chatId, chat) {
  const chatItem = document.createElement('div');
  chatItem.className = 'chat-item';
  chatItem.dataset.id = chatId;
  
  // Create icon
  const icon = document.createElement('div');
  icon.className = 'chat-icon';
  icon.style.backgroundColor = chat.themeColor || '#ccc';
  icon.textContent = chat.siteName.charAt(0);
  
  // Create chat content
  const content = document.createElement('div');
  content.className = 'chat-content';
  
  const title = document.createElement('div');
  title.className = 'chat-title';
  title.textContent = chat.title || 'Untitled Chat';
  
  const meta = document.createElement('div');
  meta.className = 'chat-meta';
  
  const site = document.createElement('span');
  site.className = 'chat-site';
  site.textContent = chat.siteName;
  
  const time = document.createElement('span');
  time.className = 'chat-time';
  time.textContent = formatDate(chat.lastUpdated);
  
  meta.appendChild(site);
  meta.appendChild(time);
  
  content.appendChild(title);
  content.appendChild(meta);
  
  // Add click handler to view chat messages
  chatItem.addEventListener('click', () => {
    currentChatId = chatId;
    loadMessages(chatId);
    
    // Switch to messages tab
    document.querySelector('.tab-btn[data-tab="messages"]').click();
  });
  
  chatItem.appendChild(icon);
  chatItem.appendChild(content);
  
  return chatItem;
}

/**
 * Display empty chats state
 */
function displayEmptyChats() {
  const container = document.getElementById('chats-container');
  container.innerHTML = `
    <div class="empty-state">
      No chats tracked yet. Visit a supported AI chat page.
    </div>
  `;
}

/**
 * Scroll to a specific message in the active tab
 * @param {string} messageId - ID of the message to scroll to
 */
function scrollToMessage(messageId) {
  getCurrentTabInfo().then(tabInfo => {
    if (!tabInfo) return;
    
    chrome.runtime.sendMessage({
      action: 'scrollToMessage',
      tabId: tabInfo.tabId,
      messageId
    });
  });
}

/**
 * Format timestamp as relative time
 * @param {number} timestamp - Timestamp in milliseconds
 * @returns {string} Formatted time string
 */
function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  
  if (diffSec < 60) {
    return 'just now';
  } else if (diffSec < 3600) {
    const min = Math.floor(diffSec / 60);
    return `${min}m ago`;
  } else if (diffSec < 86400) {
    const hour = Math.floor(diffSec / 3600);
    return `${hour}h ago`;
  } else {
    return formatDate(timestamp);
  }
}

/**
 * Format timestamp as date
 * @param {number} timestamp - Timestamp in milliseconds
 * @returns {string} Formatted date string
 */
function formatDate(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  
  // If today, show time
  if (date.toDateString() === now.toDateString()) {
    return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  // If yesterday, show "Yesterday"
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  
  // Otherwise show date
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}