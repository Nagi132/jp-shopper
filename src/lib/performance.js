/**
 * Utility for detecting and managing performance capabilities
 */

// Default performance profile
const DEFAULT_PERFORMANCE = {
  enableAnimations: true,
  enableTransitions: true,
  enableParallax: true,
  enableBackgroundEffects: true,
  cursorProfile: 'standard',
  imageQuality: 'auto'
};

// Reduced performance profile
const REDUCED_PERFORMANCE = {
  enableAnimations: true,
  enableTransitions: true,
  enableParallax: false,
  enableBackgroundEffects: false,
  cursorProfile: 'light',
  imageQuality: 'low'
};

// Minimal performance profile
const MINIMAL_PERFORMANCE = {
  enableAnimations: false,
  enableTransitions: true,
  enableParallax: false,
  enableBackgroundEffects: false,
  cursorProfile: 'none',
  imageQuality: 'minimal'
};

/**
 * Detects device capabilities and returns appropriate performance profile
 */
export function detectPerformanceProfile() {
  if (typeof window === 'undefined') {
    return DEFAULT_PERFORMANCE;
  }

  // Check for saved user preference
  const savedProfile = localStorage.getItem('performanceProfile');
  if (savedProfile) {
    return JSON.parse(savedProfile);
  }

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    return MINIMAL_PERFORMANCE;
  }

  // Check for low-end devices
  const isLowPower = window.navigator.hardwareConcurrency <= 4;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isLowPower || isMobile) {
    return REDUCED_PERFORMANCE;
  }

  // Otherwise use default performance
  return DEFAULT_PERFORMANCE;
}

/**
 * Updates performance profile and saves to localStorage
 */
export function updatePerformanceProfile(profile) {
  if (typeof window === 'undefined') {
    return;
  }
  
  localStorage.setItem('performanceProfile', JSON.stringify(profile));
  return profile;
}

/**
 * Maps cursor type based on performance profile
 */
export function getOptimalCursorType(requestedType, performanceProfile) {
  // For performance "none" profile, don't show cursor
  if (performanceProfile.cursorProfile === 'none') {
    return 'none';
  }
  
  // For "light" profile, use lightweight version
  if (performanceProfile.cursorProfile === 'light') {
    if (requestedType === 'bag') return 'light-bag';
    return requestedType;
  }
  
  // Otherwise return requested type
  return requestedType;
}

/**
 * Check if battery is in saving mode
 */
export async function checkBatterySaving() {
  if (typeof window === 'undefined' || !('getBattery' in navigator)) {
    return false;
  }
  
  try {
    const battery = await navigator.getBattery();
    return battery.level < 0.2 && !battery.charging;
  } catch (error) {
    console.log('Battery API not supported');
    return false;
  }
}

/**
 * Create a debounce function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Create a throttle function
 */
export function throttle(func, limit) {
  let lastFunc;
  let lastRan;
  return function executedFunction(...args) {
    if (!lastRan) {
      func(...args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(function() {
        if ((Date.now() - lastRan) >= limit) {
          func(...args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
} 