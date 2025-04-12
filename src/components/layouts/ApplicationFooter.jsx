'use client';

import React, { useState, useEffect } from 'react';
import ThemeCustomizer from '@/components/ui/theme-customizer';
import { Clock, Globe } from 'lucide-react';

/**
 * ApplicationFooter - A Windows 98/2000 style footer with theme customizer
 * 
 * @param {Object} props
 * @param {string} props.className - Additional classes
 * @param {Function} props.onThemeChange - Callback for theme changes
 */
const ApplicationFooter = ({ className, onThemeChange }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [visitorCount, setVisitorCount] = useState(null);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  
  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Generate a pseudorandom visitor count on first load
  useEffect(() => {
    // Try to get a stored visitor count
    let count = localStorage.getItem('visitorCount');
    
    if (!count) {
      // Generate a random 7-digit number
      count = Math.floor(1000000 + Math.random() * 9000000).toString();
      localStorage.setItem('visitorCount', count);
    }
    
    setVisitorCount(count);
  }, []);
  
  // Toggle language between English and Japanese
  const toggleLanguage = () => {
    const newLanguage = currentLanguage === 'en' ? 'jp' : 'en';
    setCurrentLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
    // In a real app, you would trigger language change throughout the app
  };
  
  return (
    <footer className={`${className} bg-[#C0C0C0] border-t border-white border-l border-white border-r border-b border-gray-800 h-6 flex items-center justify-between px-2 text-xs shadow-inner`}>
      <div className="flex items-center space-x-4">
        {/* Visitor counter - classic Y2K element */}
        {visitorCount && (
          <div className="flex items-center">
            <span className="mr-1">Visitor #</span>
            <span className="font-mono">{visitorCount}</span>
          </div>
        )}
        
        {/* Theme customizer */}
        <ThemeCustomizer onThemeChange={onThemeChange} />
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Language toggle */}
        <button 
          className="flex items-center hover:underline"
          onClick={toggleLanguage}
        >
          <Globe className="w-3 h-3 mr-1" />
          {currentLanguage === 'en' ? '🇬🇧 English' : '🇯🇵 日本語'}
        </button>
        
        {/* Current time */}
        <div className="flex items-center">
          <Clock className="w-3 h-3 mr-1" />
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </footer>
  );
};

export default ApplicationFooter;