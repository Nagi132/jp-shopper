'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from '@/components/layouts/ThemeProvider';
import { 
  detectPerformanceProfile, 
  getOptimalCursorType, 
  throttle, 
  checkBatterySaving 
} from '@/lib/performance';

// Import the cursor component with dynamic loading
const RainbowCursor = dynamic(
  () => import('@/components/effects/RainbowCursor'),
  { ssr: false }
);

const CursorWrapper = () => {
  const [iconType, setIconType] = useState('bag');
  const [performanceProfile, setPerformanceProfile] = useState(null);
  const { theme } = useTheme();
  
  // Detect performance capabilities on mount
  useEffect(() => {
    const profile = detectPerformanceProfile();
    setPerformanceProfile(profile);
    
    // Check battery status
    const checkBatteryStatus = async () => {
      const isBatterySaving = await checkBatterySaving();
      if (isBatterySaving) {
        const profile = { ...detectPerformanceProfile(), cursorProfile: 'light' };
        setPerformanceProfile(profile);
      }
    };
    
    checkBatteryStatus();
    
    // Listen for performance changes like reduced motion preference
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleReducedMotionChange = () => {
      const newProfile = detectPerformanceProfile();
      setPerformanceProfile(newProfile);
    };
    
    // Listen for performance changes from the customizer
    const handlePerformanceChange = (e) => {
      if (e.detail) {
        setPerformanceProfile(e.detail);
      }
    };
    
    window.addEventListener('performanceChange', handlePerformanceChange);
    
    if (reducedMotionQuery.addEventListener) {
      reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
      return () => {
        reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
        window.removeEventListener('performanceChange', handlePerformanceChange);
      };
    }
    
    return () => {
      window.removeEventListener('performanceChange', handlePerformanceChange);
    };
  }, []);
  
  // Create throttled update function to prevent too many iconType updates
  const updateIconType = throttle((requestedType) => {
    if (performanceProfile) {
      // Apply appropriate icon type based on performance profile
      const optimalType = getOptimalCursorType(requestedType, performanceProfile);
      setIconType(optimalType);
    } else {
      setIconType(requestedType);
    }
  }, 150);
  
  // Update icon type when theme context changes
  useEffect(() => {
    if (theme && theme.mouseIcon) {
      updateIconType(theme.mouseIcon);
    }
  }, [theme, updateIconType, performanceProfile]);
  
  // Also listen for direct themeChange events from the customizer
  useEffect(() => {
    const handleThemeChange = (e) => {
      if (e.detail && e.detail.mouseIcon) {
        updateIconType(e.detail.mouseIcon);
      }
    };
    
    window.addEventListener('themeChange', handleThemeChange);
    return () => window.removeEventListener('themeChange', handleThemeChange);
  }, [updateIconType]);
  
  return <RainbowCursor iconType={iconType} performanceProfile={performanceProfile} />;
};

export default CursorWrapper; 