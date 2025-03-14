/**
 * Background script for AI Chat Bookmark extension
 * Handles tab updates and communication with content scripts
 */

// Initialize storage on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['chats', 'bookmarks'], (result) => {
    if (!result.chats) {
      chrome.storage.local.set({ chats: {} });
      console.log('Chats storage initialized');
    }
    if (!result.bookmarks) {
      chrome.storage.local.set({ bookmarks: [] });
      console.log('Bookmarks storage initialized');
    }
  });
});

// Track active chat ID by tab
const activeChats = new Map();

// Listen for tab updates to show side panel when on supported sites
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    try {
      const url = new URL(tab.url);
      const hostname = url.hostname;
      
      // Check if current site is supported (ChatGPT or Gemini)
      if (hostname === 'chat.openai.com' || hostname === 'gemini.google.com') {
        console.log(`Supported AI chat site detected: ${hostname}`);
        
        // Enable side panel for this tab
        chrome.sidePanel.setOptions({
          tabId,
          path: 'src/ui/side_panel.html',
          enabled: true
        });
      }
    } catch (e) {
      console.error('Error processing tab URL:', e);
    }
  }
});

// Listen for messages from content script or side panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received:', message);
  
  // Handle message tracking updates from content script
  if (message.action === 'updateMessages') {
    const { chatId, messages, title, siteName, themeColor, url, timestamp } = message.data;
    
    // Store chat ID for the tab
    if (sender.tab) {
      activeChats.set(sender.tab.id, chatId);
    }
    
    // Save messages to storage
    chrome.storage.local.get(['chats'], (result) => {
      const chats = result.chats || {};
      
      chats[chatId] = {
        title,
        siteName,
        themeColor,
        url,
        timestamp,
        lastUpdated: Date.now(),
        messages
      };
      
      chrome.storage.local.set({ chats }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error saving messages:', chrome.runtime.lastError);
        } else {
          console.log(`Saved ${messages.length} messages for chat ${chatId}`);
          sendResponse({ success: true });
        }
      });
    });
    
    return true; // Keep the message channel open for async response
  }
  
  // Get active chat for a tab
  if (message.action === 'getActiveChat') {
    const { tabId } = message;
    const chatId = activeChats.get(tabId);
    
    sendResponse({ chatId });
    return false;
  }
  
  // Handle other message types...
  // Get all chats
  if (message.action === 'getAllChats') {
    chrome.storage.local.get(['chats'], (result) => {
      sendResponse({ chats: result.chats || {} });
    });
    
    return true; // Keep the message channel open for async response
  }
  
  // Get messages for a specific chat
  if (message.action === 'getMessages') {
    const { chatId } = message;
    
    chrome.storage.local.get(['chats'], (result) => {
      const chats = result.chats || {};
      const chat = chats[chatId] || { messages: [] };
      
      sendResponse({ messages: chat.messages || [] });
    });
    
    return true; // Keep the message channel open for async response
  }
  
  // Handle scroll to message request from side panel
  if (message.action === 'scrollToMessage') {
    const { tabId, messageId } = message;
    
    chrome.tabs.sendMessage(tabId, {
      action: 'scrollToMessage',
      messageId
    }, (response) => {
      sendResponse(response);
    });
    
    return true; // Keep the message channel open for async response
  }
});