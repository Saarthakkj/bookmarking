/**
 * Content script for AI Chat Bookmark extension
 * Detects and tracks message elements in AI chat platforms
 */

import siteConfig from '../config/siteConfig.js';
import { generateMessageId, highlightElement } from './utils.js';

// Track current chat ID
let currentChatId = null;
let trackedMessages = [];
let observer = null;

// Initialize when page loads
window.addEventListener('load', () => {
  console.log('AI Chat Bookmark content script loaded');
  initializeTracker();
});

/**
 * Initialize the message tracker
 */
function initializeTracker() {
  const hostname = window.location.hostname;
  const config = siteConfig[hostname];
  
  if (!config || !config.isValidPage()) {
    console.log('Not on a valid chat page');
    return;
  }
  
  // Get chat ID
  currentChatId = config.chatIdSelector();
  console.log(`Chat detected: ${currentChatId}`);
  
  // Initial scan for existing messages
  scanForMessages();
  
  // Set up observer for new messages
  setupMessageObserver(config);
  
  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'scrollToMessage' && message.messageId) {
      scrollToMessage(message.messageId);
      sendResponse({ success: true });
    }
    return true;
  });
}

/**
 * Scan the page for message elements
 */
function scanForMessages() {
  const hostname = window.location.hostname;
  const config = siteConfig[hostname];
  
  if (!config) return;
  
  const messageElements = document.querySelectorAll(config.messageSelector);
  console.log(`Found ${messageElements.length} messages`);
  
  messageElements.forEach((element, index) => {
    processMessageElement(element, index);
  });
  
  // Send updated messages to background script
  sendMessagesToBackground();
}

/**
 * Process a message element to extract data
 * @param {Element} element - The message DOM element
 * @param {number} index - Index of the message
 */
function processMessageElement(element, index) {
  const hostname = window.location.hostname;
  const config = siteConfig[hostname];
  
  // Skip if already processed
  if (element.dataset.processed === 'true') return;
  
  // Generate or get message ID
  const messageId = element.getAttribute(config.messageIdAttribute) || 
                    generateMessageId(element);
  
  // Determine message type
  const isUserMessage = element.matches(config.userMessageSelector);
  const isAssistantMessage = element.matches(config.assistantMessageSelector);
  const messageType = isUserMessage ? 'user' : (isAssistantMessage ? 'assistant' : 'system');
  
  // Get background color
  const backgroundColor = window.getComputedStyle(element).backgroundColor;
  
  // Extract text content
  const textContent = element.textContent.trim();
  
  // Create message object
  const messageData = {
    id: messageId,
    type: messageType,
    content: textContent.substring(0, 150) + (textContent.length > 150 ? '...' : ''),
    color: backgroundColor,
    timestamp: Date.now(),
    index: index
  };
  
  // Add to tracked messages if not already present
  const existingIndex = trackedMessages.findIndex(m => m.id === messageId);
  if (existingIndex >= 0) {
    trackedMessages[existingIndex] = messageData;
  } else {
    trackedMessages.push(messageData);
  }
  
  // Mark as processed
  element.dataset.processed = 'true';
  element.dataset.messageId = messageId;
}

/**
 * Set up MutationObserver to detect new messages
 * @param {Object} config - Site configuration
 */
function setupMessageObserver(config) {
  // Disconnect existing observer if any
  if (observer) {
    observer.disconnect();
  }
  
  const targetNode = document.querySelector(config.messageObserverTarget);
  if (!targetNode) {
    console.log('Message container not found, retrying in 2 seconds');
    setTimeout(() => setupMessageObserver(config), 2000);
    return;
  }
  
  // Create observer
  observer = new MutationObserver((mutations) => {
    let shouldScan = false;
    
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        shouldScan = true;
        break;
      }
    }
    
    if (shouldScan) {
      console.log('New content detected, scanning for messages');
      scanForMessages();
    }
  });
  
  // Start observing
  observer.observe(targetNode, { 
    childList: true, 
    subtree: true 
  });
  
  console.log('Message observer started');
}

/**
 * Send tracked messages to background script
 */
function sendMessagesToBackground() {
  if (!currentChatId || trackedMessages.length === 0) return;
  
  const hostname = window.location.hostname;
  const config = siteConfig[hostname];
  
  const chatData = {
    chatId: currentChatId,
    title: document.title.replace(' - ' + config.name, '').trim(),
    siteName: config.name,
    themeColor: config.themeColorSelector(),
    url: window.location.href,
    timestamp: Date.now(),
    messages: trackedMessages
  };
  
  chrome.runtime.sendMessage({
    action: 'updateMessages',
    data: chatData
  });
}

/**
 * Scroll to a specific message by ID
 * @param {string} messageId - ID of the message to scroll to
 */
function scrollToMessage(messageId) {
  const element = document.querySelector(`[data-message-id="${messageId}"]`);
  if (element) {
    highlightElement(element);
  }
}