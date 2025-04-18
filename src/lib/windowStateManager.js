// src/lib/windowStateManager.js

/**
 * Window State Manager - Handles saving and restoring window positions, sizes, and states
 * 
 * This utility handles:
 * - Saving window positions and sizes
 * - Restoring windows from local storage
 * - Handling default placement for new windows
 * - Enforcing display constraints
 * - Maintaining window z-index ordering
 * - Grid snapping and window alignment
 */

// Local storage key for window states
const WINDOW_STATES_KEY = 'win2kWindowStates';

// Grid snapping settings
const GRID_SIZE = 10; // Grid cell size in pixels
const SNAP_THRESHOLD = 15; // Distance in pixels to snap to grid
const SCREEN_EDGE_SNAP = 20; // Distance to snap to screen edges

/**
 * Save the state of all open windows
 * @param {Array} windows - Array of window objects with position, size, etc.
 */
export const saveWindowStates = (windows) => {
  try {
    // Create simplified state objects to save (only what we need)
    const statesToSave = windows.map(window => ({
      id: window.id,
      position: window.position,
      size: window.size,
      isMaximized: window.isMaximized,
      minimized: window.minimized,
      zIndex: window.zIndex,
      // Don't save component or content, just references
      component: window.component,
      title: window.title
    }));
    
    localStorage.setItem(WINDOW_STATES_KEY, JSON.stringify(statesToSave));
  } catch (error) {
    console.error('Error saving window states:', error);
  }
};

/**
 * Load saved window states from localStorage
 * @returns {Array} Array of saved window state objects
 */
export const loadWindowStates = () => {
  try {
    const savedStates = localStorage.getItem(WINDOW_STATES_KEY);
    if (savedStates) {
      return JSON.parse(savedStates);
    }
  } catch (error) {
    console.error('Error loading window states:', error);
  }
  
  return [];
};

/**
 * Save state for a specific window
 * @param {string} windowId - ID of the window to save
 * @param {Object} state - State data to save
 */
export const saveWindowState = (windowId, state) => {
  try {
    // Load existing states
    const states = loadWindowStates();
    
    // Find and update or add the window state
    const existingIndex = states.findIndex(w => w.id === windowId);
    if (existingIndex >= 0) {
      states[existingIndex] = { ...states[existingIndex], ...state };
    } else {
      states.push({ id: windowId, ...state });
    }
    
    // Save updated states
    localStorage.setItem(WINDOW_STATES_KEY, JSON.stringify(states));
  } catch (error) {
    console.error(`Error saving state for window ${windowId}:`, error);
  }
};

/**
 * Get the saved state for a specific window
 * @param {string} windowId - ID of the window to load
 * @returns {Object|null} The window state or null if not found
 */
export const getWindowState = (windowId) => {
  try {
    const states = loadWindowStates();
    return states.find(w => w.id === windowId) || null;
  } catch (error) {
    console.error(`Error getting state for window ${windowId}:`, error);
    return null;
  }
};

/**
 * Clear saved states for windows that no longer exist
 * @param {Array} currentWindowIds - IDs of currently open windows
 */
export const cleanupWindowStates = (currentWindowIds) => {
  try {
    const states = loadWindowStates();
    const filteredStates = states.filter(state => 
      currentWindowIds.includes(state.id)
    );
    
    localStorage.setItem(WINDOW_STATES_KEY, JSON.stringify(filteredStates));
  } catch (error) {
    console.error('Error cleaning up window states:', error);
  }
};

/**
 * Get a cascading position for a new window
 * @param {Array} existingWindows - Currently open windows
 * @param {Object} desktopSize - Desktop dimensions {width, height}
 * @returns {Object} Position {x, y}
 */
export const getNewWindowPosition = (existingWindows, desktopSize) => {
  // Default starting position
  const basePosition = { x: 50, y: 50 };
  
  // If no existing windows, use default position
  if (!existingWindows || existingWindows.length === 0) {
    return basePosition;
  }
  
  // Calculate cascade position based on existing windows
  const lastWindow = existingWindows[existingWindows.length - 1];
  const cascadeOffset = 30; // Pixels to offset each new window
  
  let newX = (lastWindow.position?.x || basePosition.x) + cascadeOffset;
  let newY = (lastWindow.position?.y || basePosition.y) + cascadeOffset;
  
  // Ensure the window is within desktop bounds
  const maxX = desktopSize.width - 400; // Assume minimum window width of 400px
  const maxY = desktopSize.height - 300; // Assume minimum window height of 300px
  
  // If we're off the edge, start over from the top left
  if (newX > maxX || newY > maxY) {
    return basePosition;
  }
  
  return { x: newX, y: newY };
};

/**
 * Ensure a window is within the desktop bounds
 * @param {Object} position - Window position {x, y}
 * @param {Object} size - Window size {width, height}
 * @param {Object} desktopSize - Desktop dimensions {width, height}
 * @returns {Object} Adjusted position
 */
export const constrainWindowToDesktop = (position, size, desktopSize) => {
  let { x, y } = position;
  const { width, height } = size;
  
  // Ensure the window isn't positioned off-screen
  const maxX = desktopSize.width - Math.min(100, width); // At least 100px visible
  const maxY = desktopSize.height - Math.min(40, height); // At least title bar visible
  
  // Constrain x and y within bounds
  x = Math.min(Math.max(0, x), maxX);
  y = Math.min(Math.max(0, y), maxY);
  
  return { x, y };
};

/**
 * Snap window position to grid or screen edges
 * @param {Object} position - Window position {x, y}
 * @param {Object} size - Window size {width, height}
 * @param {Object} desktopSize - Desktop dimensions {width, height}
 * @returns {Object} Snapped position
 */
export const snapWindowPosition = (position, size, desktopSize) => {
  let { x, y } = position;
  const { width, height } = size;
  
  // Check for screen edge snapping - left edge
  if (Math.abs(x) < SCREEN_EDGE_SNAP) {
    x = 0;
  }
  
  // Right edge
  if (Math.abs(x + width - desktopSize.width) < SCREEN_EDGE_SNAP) {
    x = desktopSize.width - width;
  }
  
  // Top edge
  if (Math.abs(y) < SCREEN_EDGE_SNAP) {
    y = 0;
  }
  
  // Bottom edge
  if (Math.abs(y + height - desktopSize.height) < SCREEN_EDGE_SNAP) {
    y = desktopSize.height - height;
  }
  
  // Grid snapping
  if (x % GRID_SIZE < SNAP_THRESHOLD) {
    x = Math.floor(x / GRID_SIZE) * GRID_SIZE;
  } else if (x % GRID_SIZE > GRID_SIZE - SNAP_THRESHOLD) {
    x = Math.ceil(x / GRID_SIZE) * GRID_SIZE;
  }
  
  if (y % GRID_SIZE < SNAP_THRESHOLD) {
    y = Math.floor(y / GRID_SIZE) * GRID_SIZE;
  } else if (y % GRID_SIZE > GRID_SIZE - SNAP_THRESHOLD) {
    y = Math.ceil(y / GRID_SIZE) * GRID_SIZE;
  }
  
  return { x, y };
};

/**
 * Get a new z-index value that's higher than all existing windows
 * @param {Array} windows - Currently open windows
 * @returns {number} New z-index value
 */
export const getTopZIndex = (windows) => {
  if (!windows || windows.length === 0) {
    return 1000; // Base z-index
  }
  
  // Find the highest z-index
  const highestZ = windows.reduce((highest, window) => {
    const windowZ = window.zIndex || 0;
    return windowZ > highest ? windowZ : highest;
  }, 0);
  
  return highestZ + 1;
};

/**
 * Get default window sizes for different component types
 * @param {string} componentType - Type of window component
 * @param {Object} desktopSize - Desktop dimensions {width, height}
 * @returns {Object} Size object {width, height}
 */
export const getDefaultWindowSize = (componentType, desktopSize) => {
  // Default sizes for various window types
  const defaultSizes = {
    'HomePage': { width: 800, height: 600 },
    'ExplorePage': { width: 900, height: 600 },
    'RequestsPage': { width: 800, height: 600 },
    'MessagesPage': { width: 700, height: 500 },
    'NotificationsPage': { width: 500, height: 700 },
    'FavoritesPage': { width: 800, height: 600 },
    'RequestDetail': { width: 800, height: 700 },
    'InternetExplorer': { width: 1000, height: 700 },
    'Email': { width: 800, height: 600 },
    'Calculator': { width: 300, height: 400 },
    'Notepad': { width: 600, height: 500 },
    'ControlPanel': { width: 700, height: 500 },
    'HelpPage': { width: 600, height: 500 },
    'CommandPrompt': { width: 650, height: 400 },
    // Default size if not specified
    'default': { width: 800, height: 600 }
  };
  
  // Get the size for this component type, or use default
  const size = defaultSizes[componentType] || defaultSizes.default;
  
  // Ensure the window isn't larger than the desktop
  size.width = Math.min(size.width, desktopSize.width - 50);
  size.height = Math.min(size.height, desktopSize.height - 50);
  
  return size;
};

/**
 * Calculate window transition animation properties
 * @param {Object} from - Starting position and size {position: {x, y}, size: {width, height}}
 * @param {Object} to - Ending position and size {position: {x, y}, size: {width, height}}
 * @returns {Object} Animation parameters
 */
export const calculateTransition = (from, to) => {
  return {
    duration: 200, // Animation duration in milliseconds
    from,
    to,
    easing: 'cubic-bezier(0.25, 0.1, 0.25, 1.0)' // Standard ease-out curve
  };
};

// Export all functions
export default {
  saveWindowStates,
  loadWindowStates,
  saveWindowState,
  getWindowState,
  cleanupWindowStates,
  getNewWindowPosition,
  constrainWindowToDesktop,
  snapWindowPosition,
  getTopZIndex,
  getDefaultWindowSize,
  calculateTransition
};