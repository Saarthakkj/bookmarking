/**
 * Side panel script for AI Chat Bookmark extension
 * Displays and manages bookmarked chats
 */

// Load bookmarks when side panel opens
document.addEventListener('DOMContentLoaded', () => {
  loadBookmarks();
  
  // Set up search functionality
  const searchBox = document.getElementById('search-box');
  searchBox.addEventListener('input', () => {
    loadBookmarks(searchBox.value);
  });
});

/**
 * Load bookmarks from storage and display them
 * @param {string} searchTerm - Optional search term to filter bookmarks
 */
function loadBookmarks(searchTerm = '') {
  chrome.runtime.sendMessage({ action: 'getBookmarks' }, (response) => {
    const bookmarksContainer = document.getElementById('bookmarks-container');
    let bookmarks = response.bookmarks || [];
    
    // Filter bookmarks if search term is provided
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      bookmarks = bookmarks.filter(bookmark => 
        bookmark.title.toLowerCase().includes(term) || 
        bookmark.siteName.toLowerCase().includes(term)
      );
    }
    
    // Sort bookmarks by timestamp (newest first)
    bookmarks.sort((a, b) => b.timestamp - a.timestamp);
    
    // Display bookmarks or empty state
    if (bookmarks.length === 0) {
      if (searchTerm) {
        bookmarksContainer.innerHTML = `
          <div class="no-results">
            No bookmarks match your search.
          </div>
        `;
      } else {
        bookmarksContainer.innerHTML = `
          <div class="empty-state">
            No bookmarks yet. Click the bookmark button on any AI chat page to save it.
          </div>
        `;
      }
    } else {
      bookmarksContainer.innerHTML = `<div class="bookmark-list"></div>`;
      const bookmarkList = bookmarksContainer.querySelector('.bookmark-list');
      
      bookmarks.forEach(bookmark => {
        const bookmarkElement = createBookmarkElement(bookmark);
        bookmarkList.appendChild(bookmarkElement);
      });
    }
  });
}

/**
 * Create a DOM element for a bookmark
 * @param {Object} bookmark - The bookmark data
 * @returns {HTMLElement} The bookmark element
 */
function createBookmarkElement(bookmark) {
  const bookmarkItem = document.createElement('div');
  bookmarkItem.className = 'bookmark-item';
  bookmarkItem.dataset.id = bookmark.chatId;
  
  // Create icon with first letter and theme color
  const icon = document.createElement('div');
  icon.className = 'bookmark-icon';
  icon.style.backgroundColor = bookmark.themeColor || '#888';
  icon.textContent = bookmark.siteName.charAt(0);
  
  // Create bookmark content
  const content = document.createElement('div');
  content.className = 'bookmark-content';
  
  const title = document.createElement('div');
  title.className = 'bookmark-title';
  title.textContent = bookmark.title || 'Untitled Chat';
  
  const site = document.createElement('div');
  site.className = 'bookmark-site';
  site.textContent = bookmark.siteName;
  
  const date = document.createElement('div');
  date.className = 'bookmark-date';
  date.textContent = formatDate(bookmark.timestamp);
  
  content.appendChild(title);
  content.appendChild(site);
  content.appendChild(date);
  
  // Create actions
  const actions = document.createElement('div');
  actions.className = 'bookmark-actions';
  
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-btn';
  deleteBtn.innerHTML = '&times;';
  deleteBtn.title = 'Delete bookmark';
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteBookmark(bookmark.chatId);
  });
  
  actions.appendChild(deleteBtn);
  
  // Assemble bookmark item
  bookmarkItem.appendChild(icon);
  bookmarkItem.appendChild(content);
  bookmarkItem.appendChild(actions);
  
  // Add click handler to open the chat
  bookmarkItem.addEventListener('click', () => {
    chrome.tabs.create({ url: bookmark.url });
  });
  
  return bookmarkItem;
}

/**
 * Format a timestamp into a readable date
 * @param {number} timestamp - The timestamp to format
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

/**
 * Delete a bookmark
 * @param {string} chatId - ID of the bookmark to delete
 */
function deleteBookmark(chatId) {
  if (confirm('Are you sure you want to delete this bookmark?')) {
    chrome.runtime.sendMessage({ 
      action: 'deleteBookmark', 
      chatId 
    }, (response) => {
      if (response && response.success) {
        loadBookmarks(document.getElementById('search-box').value);
      }
    });
  }
}

/**
 * Generate a color icon for a bookmark
 * @param {string} letter - The letter to display in the icon
 * @param {string} color - The background color
 * @returns {string} Data URL of the icon
 */
function generateIcon(letter, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  
  // Draw circle background
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(16, 16, 16, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw letter
  ctx.fillStyle = 'white';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(letter, 16, 16);
  
  return canvas.toDataURL();
}