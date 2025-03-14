/**
 * Content script for AI Chat Bookmark extension
 * Extracts chat information from supported AI chat websites
 */

// Import site configuration
import siteConfig from './siteConfig.js';

/**
 * Extract chat data based on the current website
 * @returns {Object|null} Chat data object or null if not on a supported page
 */
function extractChatData() {
  const hostname = window.location.hostname;
  const config = siteConfig[hostname];
  
  if (!config || !config.isValidPage()) {
    console.log('Not on a valid chat page');
    return null;
  }
  
  try {
    const chatId = config.chatIdSelector();
    const themeColor = config.themeColorSelector();
    const title = document.title.replace(' - ' + config.name, '').trim();
    const timestamp = Date.now();
    const url = window.location.href;
    
    console.log(`Extracted chat data: ID=${chatId}, Color=${themeColor}`);
    
    return {
      chatId,
      title,
      themeColor,
      siteName: config.name,
      timestamp,
      url
    };
  } catch (error) {
    console.error('Error extracting chat data:', error);
    return null;
  }
}

/**
 * Create and show the bookmark button in the UI
 */
function createBookmarkButton() {
  // Remove existing button if any
  const existingButton = document.getElementById('ai-chat-bookmark-btn');
  if (existingButton) {
    existingButton.remove();
  }
  
  // Create new button
  const button = document.createElement('button');
  button.id = 'ai-chat-bookmark-btn';
  button.innerHTML = '🔖';
  button.title = 'Bookmark this chat';
  button.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    z-index: 9999;
    background: #ffffff;
    border: 1px solid #ddd;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    font-size: 20px;
    cursor: pointer;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    transition: all 0.3s ease;
  `;
  
  // Add hover effect
  button.addEventListener('mouseover', () => {
    button.style.transform = 'scale(1.1)';
  });
  
  button.addEventListener('mouseout', () => {
    button.style.transform = 'scale(1)';
  });
  
  // Add click handler
  button.addEventListener('click', () => {
    const chatData = extractChatData();
    if (chatData) {
      // Send data to background script
      chrome.runtime.sendMessage({
        action: 'saveBookmark',
        data: chatData
      }, (response) => {
        if (response && response.success) {
          // Show success feedback
          button.innerHTML = '✓';
          button.style.backgroundColor = '#4CAF50';
          button.style.color = 'white';
          
          // Reset after 2 seconds
          setTimeout(() => {
            button.innerHTML = '🔖';
            button.style.backgroundColor = '#ffffff';
            button.style.color = 'inherit';
          }, 2000);
        }
      });
    }
  });
  
  // Add to page
  document.body.appendChild(button);
}

// Initialize when page loads
window.addEventListener('load', () => {
  console.log('AI Chat Bookmark content script loaded');
  
  // Create bookmark button if on a supported site
  const hostname = window.location.hostname;
  if (siteConfig[hostname]) {
    createBookmarkButton();
  }
});

// Listen for URL changes (for single-page applications)
let lastUrl = window.location.href;
new MutationObserver(() => {
  if (lastUrl !== window.location.href) {
    lastUrl = window.location.href;
    console.log('URL changed:', lastUrl);
    
    // Check if we should show the bookmark button
    const hostname = window.location.hostname;
    if (siteConfig[hostname] && siteConfig[hostname].isValidPage()) {
      setTimeout(createBookmarkButton, 1000); // Delay to ensure page is loaded
    }
  }
}).observe(document, { subtree: true, childList: true });