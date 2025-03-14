/**
 * Configuration for supported AI chat websites
 * Contains site-specific selectors and extraction logic
 */
const siteConfig = {
  // ChatGPT configuration
  "chat.openai.com": {
    name: "ChatGPT",
    chatIdSelector: () => {
      // Extract chat ID from URL
      const urlParts = window.location.pathname.split('/');
      return urlParts[urlParts.length - 1];
    },
    messageSelector: ".text-message-content", // Selector for message elements
    userMessageSelector: ".text-message-content[data-message-author-role='user']",
    assistantMessageSelector: ".text-message-content[data-message-author-role='assistant']",
    messageIdAttribute: "data-message-id", // Attribute containing message ID
    messageObserverTarget: ".chat-container", // Element to observe for new messages
    themeColorSelector: () => {
      // Extract theme color from ChatGPT's UI
      const navbar = document.querySelector('nav');
      if (navbar) {
        return window.getComputedStyle(navbar).backgroundColor;
      }
      return "#10a37f"; // Default ChatGPT color
    },
    isValidPage: () => window.location.pathname.includes('/c/')
  },
  
  // Google Gemini configuration
  "gemini.google.com": {
    name: "Gemini",
    chatIdSelector: () => {
      // Extract chat ID from URL or data attributes
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('chatId') || 'gemini-' + Date.now();
    },
    messageSelector: ".message-content", // Selector for message elements
    userMessageSelector: ".user-message .message-content",
    assistantMessageSelector: ".model-response .message-content",
    messageIdAttribute: "data-message-id", // Attribute containing message ID
    messageObserverTarget: ".conversation-container", // Element to observe for new messages
    themeColorSelector: () => {
      // Extract theme color from Gemini's UI
      const header = document.querySelector('header');
      if (header) {
        return window.getComputedStyle(header).backgroundColor;
      }
      return "#8e44ad"; // Default Gemini color
    },
    isValidPage: () => true // All Gemini pages are valid for now
  }
};

export default siteConfig;