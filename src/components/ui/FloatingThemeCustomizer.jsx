'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Palette, Check, CircleSlash, Sparkles, Grid, X, Upload, Image } from 'lucide-react';
import { IconPhotoPlus, IconDeviceFloppy, IconArrowsShuffle, IconX, IconAdjustments, IconEye, IconPhoto, IconPalette, IconWallpaper, IconMouse, IconCloudUpload } from '@tabler/icons-react';

/**
 * FloatingThemeCustomizer - A draggable color palette that starts as an icon
 * Fixed to prevent opening after drag
 * 
 * @param {Object} props
 * @param {Function} props.onThemeChange - Callback when theme changes
 */
const FloatingThemeCustomizer = ({ onThemeChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('colors'); // 'colors' or 'patterns' or 'mouse' or 'performance' or 'desktop'
  const [currentTheme, setCurrentTheme] = useState({
    borderColor: '69EFD7',
    bgColor: 'FED1EB',
    pattern: 'none',
    name: 'Mint & Pink',
    mouseIcon: 'bag',
    desktopOpacity: 0
  });
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [size, setSize] = useState({ width: 350, height: 450 }); // Increase default size
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false); // Add state for resizing
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0 }); // Add state for resize starting point
  const [performanceProfile, setPerformanceProfile] = useState(null);
  const customizerId = "theme-customizer";
  const customizerRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // Track if we've moved during this drag operation
  const hasMoved = useRef(false);
  // Track where the drag started
  const dragStartPos = useRef({ x: 0, y: 0 });
  
  // Predefined themes - Y2K-appropriate names
  const THEMES = [
    { 
      name: "Mint & Pink", 
      borderColor: "69EFD7", 
      bgColor: "FED1EB",
      textColor: "000000"
    },
    { 
      name: "Cyber Neon", 
      borderColor: "FE66FE", 
      bgColor: "51F5FF",
      textColor: "000000"
    },
    { 
      name: "Vaporwave", 
      borderColor: "E7F227", 
      bgColor: "293EFE",
      textColor: "FFFFFF"
    },
    { 
      name: "Kawaii", 
      borderColor: "FF80D5", 
      bgColor: "D6FDFF",
      textColor: "000000"
    },
    { 
      name: "Millennium", 
      borderColor: "FFD700", 
      bgColor: "F5F5DC",
      textColor: "000000"
    },
    { 
      name: "Pixel Pop", 
      borderColor: "9966FF", 
      bgColor: "E6E6FA",
      textColor: "000000"
    }
  ];

  // Desktop backgrounds from public folder
  const desktopBackgrounds = [
    { name: 'Desktop 1', value: '/desktop/1.jpg' },
    { name: 'Desktop 2', value: '/desktop/2.jpg' },
    { name: 'Desktop 3', value: '/desktop/3.jpg' },
    { name: 'Desktop 4 (Animated)', value: '/desktop/4.gif' },
    { name: 'Desktop 5', value: '/desktop/5.jpg' },
  ];

  // Background patterns
  const BG_PATTERNS = [
    { 
      name: "None", 
      value: "none",
      icon: <CircleSlash size={16} />
    },
    { 
      name: "Stars", 
      value: "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18l5-4 5 4-2-6 5-3h-6l-2-6-2 6H8l5 3-2 6zm30 14l3-2 3 2-1-4 3-2h-4l-1-4-1 4h-4l3 2-1 4zM70 18l5-4 5 4-2-6 5-3h-6l-2-6-2 6h-6l5 3-2 6z' fill='%239C92AC' fill-opacity='0.2' fill-rule='evenodd'/%3E%3C/svg%3E\")",
      icon: <Sparkles size={16} />
    },
    { 
      name: "Dots", 
      value: "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239C92AC' fill-opacity='0.2' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='1'/%3E%3Ccircle cx='13' cy='13' r='1'/%3E%3C/g%3E%3C/svg%3E\")",
      icon: <div className="flex gap-1">
              <div className="w-1 h-1 rounded-full bg-current"></div>
              <div className="w-1 h-1 rounded-full bg-current"></div>
            </div>
    },
    { 
      name: "Grid", 
      value: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239C92AC' fill-opacity='0.2' fill-rule='evenodd'%3E%3Cpath d='M0 0h40v40H0V0zm1 1h38v38H1V1z'/%3E%3C/g%3E%3C/svg%3E\")",
      icon: <Grid size={16} />
    },
    // Cute Patterns
    {
      name: "Heart Rain",
      value: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M8 15.22c0-4.2 3.4-7.6 7.6-7.6 2.46 0 4.65 1.17 6.04 2.97A7.6 7.6 0 0 1 30 8a7.6 7.6 0 0 1 6.04 15.3c-.25.22-.5.41-.76.57l-5.14 5.3-5.3-5.3a7.6 7.6 0 0 1-8.95-2.02 7.58 7.58 0 0 1-7.89-6.63zM46 17.33c0-3.07 2.5-5.57 5.57-5.57a5.58 5.58 0 0 1 4.43 13.05l-4.43 4.55-4.43-4.55a5.55 5.55 0 0 1-1.14-7.48zM27 44.7c0-2.36 1.92-4.28 4.28-4.28 1.3 0 2.45.57 3.23 1.47.77-.9 1.92-1.47 3.22-1.47a4.28 4.28 0 0 1 3.23 7.1l-3.23 3.32-3.22-3.32a4.28 4.28 0 0 1-7.51-2.82z' fill='%23FF90B3' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E\")",
      icon: <div className="text-xl">❤️</div>
    },
    {
      name: "Bubbles",
      value: "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='15' cy='15' r='10' fill='%238BB3FF' fill-opacity='0.2'/%3E%3Ccircle cx='45' cy='45' r='16' fill='%238BB3FF' fill-opacity='0.3'/%3E%3Ccircle cx='75' cy='30' r='12' fill='%238BB3FF' fill-opacity='0.2'/%3E%3Ccircle cx='30' cy='70' r='8' fill='%238BB3FF' fill-opacity='0.3'/%3E%3Ccircle cx='80' cy='80' r='14' fill='%238BB3FF' fill-opacity='0.2'/%3E%3C/svg%3E\")",
      icon: <div className="text-xl">🫧</div>
    },
    {
      name: "Paws",
      value: "url(\"data:image/svg+xml,%3Csvg width='90' height='90' viewBox='0 0 90 90' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23D2A679' fill-opacity='0.2'%3E%3Cpath d='M15 20a5 5 0 0 1 5-5 5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5zm-5-5a5 5 0 0 1 5-5 5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5zm25 5a5 5 0 0 1 5-5 5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5zm-5-5a5 5 0 0 1 5-5 5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5zm50 50a5 5 0 0 1 5-5 5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5zm-5-5a5 5 0 0 1 5-5 5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5zm25 5a5 5 0 0 1 5-5 5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5zm-5-5a5 5 0 0 1 5-5 5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5z'/%3E%3C/g%3E%3C/svg%3E\")",
      icon: <div className="text-xl">🐾</div>
    },
    {
      name: "Flowers",
      value: "url(\"data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23F8A1D1' fill-opacity='0.3'%3E%3Cpath d='M50 50c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10s-10-4.477-10-10 4.477-10 10-10zM10 10c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10S0 25.523 0 20s4.477-10 10-10zm10 60c5.523 0 10 4.477 10 10s-4.477 10-10 10-10-4.477-10-10c-5.523 0-10-4.477-10-10s4.477-10 10-10 10 4.477 10 10z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      icon: <div className="text-xl">🌸</div>
    },
    // Aggressive/Bold Patterns
    {
      name: "Lightning",
      value: "url(\"data:image/svg+xml,%3Csvg width='60' height='90' viewBox='0 0 60 90' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23FFD700' fill-opacity='0.3'%3E%3Cpath d='M36 10L6 40l10 10-6 20 38-40-10-10 8-20'/%3E%3C/g%3E%3C/svg%3E\")",
      icon: <div className="text-xl">⚡</div>
    },
    {
      name: "Jagged",
      value: "url(\"data:image/svg+xml,%3Csvg width='84' height='48' viewBox='0 0 84 48' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h12v6H0V0zm28 8h12v6H28V8zm14-8h12v6H42V0zm14 0h12v6H56V0zm0 8h12v6H56V8zM42 8h12v6H42V8zm0 16h12v6H42v-6zm14-8h12v6H56v-6zm14 0h12v6H70v-6zm0-16h12v6H70V0zM28 32h12v6H28v-6zM14 16h12v6H14v-6zM0 24h12v6H0v-6zm0 8h12v6H0v-6zm14 0h12v6H14v-6zm14 8h12v6H28v-6zm-14 0h12v6H14v-6zm28 0h12v6H42v-6zm14-8h12v6H56v-6zm0-8h12v6H56v-6zm14 8h12v6H70v-6zm0 8h12v6H70v-6zM14 24h12v6H14v-6zm14-8h12v6H28v-6zM14 8h12v6H14V8zM0 8h12v6H0V8z' fill='%23FF3333' fill-opacity='0.2' fill-rule='evenodd'/%3E%3C/svg%3E\")",
      icon: <div className="text-xl">〽️</div>
    },
    {
      name: "Circuit",
      value: "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h100v100H0V0zm40 40v20h20V40H40zm20 20v20h20V60H60zm-20 0H20v20h20V60z' fill='%2300FF00' fill-opacity='0.2' fill-rule='evenodd'/%3E%3C/svg%3E\")",
      icon: <div className="text-xl">🔌</div>
    },
    {
      name: "Bricks",
      value: "url(\"data:image/svg+xml,%3Csvg width='42' height='44' viewBox='0 0 42 44' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='0.1' fill-rule='evenodd'%3E%3Cpath d='M0 0h42v44H0V0zm1 1h40v20H1V1zM0 23h20v20H0V23zm22 0h20v20H22V23z'/%3E%3C/g%3E%3C/svg%3E\")",
      icon: <div className="text-xl">🧱</div>
    },
    // Experimental/Unique Patterns
    {
      name: "Glitch",
      value: "url(\"data:image/svg+xml,%3Csvg width='90' height='90' viewBox='0 0 90 90' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23999999' fill-opacity='0.3' fill-rule='evenodd'%3E%3Cpath d='M10 90H0V10h10v80zm20-10H20V10h10v70zm20 0H40V20h10v60zm20 0H60V30h10v50zm20 0H80V50h10v30z'/%3E%3Cpath d='M-10 60h10V10h-10v50zm20-30h10V-10H10v40zm20 10h10V-10H30v40zm20 20h10V-10H50v70zm20 10h10V-10H70v90z'/%3E%3C/g%3E%3C/svg%3E\")",
      icon: <div className="text-xl">👾</div>
    },
    {
      name: "Crosses",
      value: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      icon: <div className="text-xl">➕</div>
    },
    {
      name: "Checkers",
      value: "url(\"data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='0.1' fill-rule='evenodd'%3E%3Cpath d='M0 0h40v40H0V0zm40 40h40v40H40V40zm0-40h2l-2 2V0zm0 4l4-4h2l-6 6V4zm0 4l8-8h2L40 10V8zm0 4L52 0h2L40 14v-2zm0 4L56 0h2L40 18v-2zm0 4L60 0h2L40 22v-2zm0 4L64 0h2L40 26v-2zm0 4L68 0h2L40 30v-2zm0 4L72 0h2L40 34v-2zm0 4L76 0h2L40 38v-2zm0 4L80 0v2L42 40h-2zm4 0L80 4v2L46 40h-2zm4 0L80 8v2L50 40h-2zm4 0l28-28v2L54 40h-2zm4 0l24-24v2L58 40h-2zm4 0l20-20v2L62 40h-2zm4 0l16-16v2L66 40h-2zm4 0l12-12v2L70 40h-2zm4 0l8-8v2l-6 6h-2zm4 0l4-4v2l-2 2h-2z'/%3E%3C/g%3E%3C/svg%3E\")",
      icon: <div className="text-xl">🏁</div>
    },
    {
      name: "Waves",
      value: "url(\"data:image/svg+xml,%3Csvg width='100' height='20' viewBox='0 0 100 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M21.184 20c.357-.13.72-.264 1.088-.402l1.768-.661C33.64 15.347 39.647 14 50 14c10.271 0 15.362 1.222 24.629 4.928.955.383 1.869.74 2.75 1.072h6.225c-2.51-.73-5.139-1.691-8.233-2.928C65.888 13.278 60.562 12 50 12c-10.626 0-16.855 1.397-26.66 5.063l-1.767.662c-2.475.923-4.66 1.674-6.724 2.275h6.335zm0-20C13.258 2.892 8.077 4 0 4V2c5.744 0 9.951-.574 14.85-2h6.334zM77.38 0C85.239 2.966 90.502 4 100 4V2c-6.842 0-11.386-.542-16.396-2h-6.225zM0 14c8.44 0 13.718-1.21 22.272-4.402l1.768-.661C33.64 5.347 39.647 4 50 4c10.271 0 15.362 1.222 24.629 4.928C84.112 12.722 89.438 14 100 14v-2c-10.271 0-15.362-1.222-24.629-4.928C65.888 3.278 60.562 2 50 2 39.374 2 33.145 3.397 23.34 7.063l-1.767.662C13.223 10.84 8.163 12 0 12v2z' fill='%239C92AC' fill-opacity='0.2' fill-rule='evenodd'/%3E%3C/svg%3E\")",
      icon: <div className="text-xl">🌊</div>
    },
    {
      name: "Y2K Bubble",
      value: "url(\"data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='bubble' width='120' height='120' patternUnits='userSpaceOnUse'%3E%3Ccircle cx='60' cy='60' r='50' fill='%23FF99CC' fill-opacity='0.2'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23bubble)'/%3E%3Ccircle cx='30' cy='30' r='25' fill='%2333CCFF' fill-opacity='0.3'/%3E%3Ccircle cx='90' cy='90' r='25' fill='%23FFFF66' fill-opacity='0.3'/%3E%3C/svg%3E\")",
      icon: <div className="text-xl">🔮</div>
    },
    {
      name: "Pixel Art",
      value: "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm32-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%2399ccff' fill-opacity='0.3' fill-rule='evenodd'/%3E%3C/svg%3E\")",
      icon: <div className="text-xl">👾</div>
    },
    {
      name: "Memphis",
      value: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ff9933' fill-opacity='0.2'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3Cg fill='%2366ccff' fill-opacity='0.2'%3E%3Cpath d='M45 32v-2h-8v2h8zm0-16v-2h-8v2h8zM9 32v-2H1v2h8zm0-16v-2H1v2h8z'/%3E%3C/g%3E%3Cg fill='%23FF66CC' fill-opacity='0.2'%3E%3Cpath d='M22 48v-2h16v2H22zm0-16v-2h16v2H22zm0-16v-2h16v2H22z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      icon: <div className="text-xl">🎨</div>
    },
    {
      name: "CD ROM",
      value: "url(\"data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3ClinearGradient id='cd' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23FF99CC' stop-opacity='0.1'/%3E%3Cstop offset='50%25' stop-color='%2333CCFF' stop-opacity='0.2'/%3E%3Cstop offset='100%25' stop-color='%2399FF66' stop-opacity='0.1'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='60' cy='60' r='50' stroke='%23AAAAAA' stroke-width='1' fill='url(%23cd)' fill-opacity='0.7'/%3E%3Ccircle cx='60' cy='60' r='45' stroke='%23CCCCCC' stroke-width='0.5' fill='none'/%3E%3Ccircle cx='60' cy='60' r='40' stroke='%23DDDDDD' stroke-width='0.5' fill='none'/%3E%3Ccircle cx='60' cy='60' r='35' stroke='%23EEEEEE' stroke-width='0.5' fill='none'/%3E%3Ccircle cx='60' cy='60' r='15' stroke='%23DDDDDD' stroke-width='1' fill='%23FFFFFF' fill-opacity='0.3'/%3E%3Ccircle cx='60' cy='60' r='12' stroke='none' fill='%23CCCCCC' fill-opacity='0.3'/%3E%3C/svg%3E\")",
      icon: <div className="text-xl">💿</div>
    },
    {
      name: "Win 95",
      value: "url(\"data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='50' height='50' x='0' y='0' fill='%230000AA' fill-opacity='0.2'/%3E%3Crect width='50' height='50' x='50' y='0' fill='%2300AA00' fill-opacity='0.2'/%3E%3Crect width='50' height='50' x='100' y='0' fill='%23AA0000' fill-opacity='0.2'/%3E%3Crect width='50' height='50' x='150' y='0' fill='%23AAAA00' fill-opacity='0.2'/%3E%3Crect width='50' height='50' x='0' y='50' fill='%23AA00AA' fill-opacity='0.2'/%3E%3Crect width='50' height='50' x='50' y='50' fill='%2300AAAA' fill-opacity='0.2'/%3E%3Crect width='50' height='50' x='100' y='50' fill='%23000000' fill-opacity='0.1'/%3E%3Crect width='50' height='50' x='150' y='50' fill='%23AAAAAA' fill-opacity='0.2'/%3E%3Crect width='50' height='50' x='0' y='100' fill='%23FFFFFF' fill-opacity='0.2'/%3E%3Crect width='50' height='50' x='50' y='100' fill='%230000AA' fill-opacity='0.1'/%3E%3Crect width='50' height='50' x='100' y='100' fill='%2300AA00' fill-opacity='0.1'/%3E%3Crect width='50' height='50' x='150' y='100' fill='%23AA0000' fill-opacity='0.1'/%3E%3Crect width='50' height='50' x='0' y='150' fill='%23AAAA00' fill-opacity='0.1'/%3E%3Crect width='50' height='50' x='50' y='150' fill='%23AA00AA' fill-opacity='0.1'/%3E%3Crect width='50' height='50' x='100' y='150' fill='%2300AAAA' fill-opacity='0.1'/%3E%3Crect width='50' height='50' x='150' y='150' fill='%23000000' fill-opacity='0.05'/%3E%3C/svg%3E\")",
      icon: <div className="text-xl">📊</div>
    },
    {
      name: "Cyber",
      value: "url(\"data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20h80v80H20V20zm0 0l80 80M20 100l80-80' stroke='%2300FFFF' stroke-width='1' fill='none' fill-opacity='0.1'/%3E%3Cpath d='M50 0v120M0 50h120' stroke='%23FF00FF' stroke-width='0.5' stroke-dasharray='2,4' fill='none'/%3E%3Cpath d='M60 0v120M0 60h120' stroke='%2300FF00' stroke-width='0.5' stroke-dasharray='1,9' fill='none'/%3E%3C/svg%3E\")",
      icon: <div className="text-xl">🤖</div>
    },
    {
      name: "Comic",
      value: "url(\"data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='%23FFFF33' fill-opacity='0.2' d='M0 0h60v60H0z'/%3E%3Cpath fill='%23FF6666' fill-opacity='0.2' d='M60 0h60v60H60z'/%3E%3Cpath fill='%2366FF66' fill-opacity='0.2' d='M0 60h60v60H0z'/%3E%3Cpath fill='%236666FF' fill-opacity='0.2' d='M60 60h60v60H60z'/%3E%3Cpath d='M15 15h30v30H15V15zm60 0h30v30H75V15zm-60 60h30v30H15V75zm60 0h30v30H75V75z' fill='%23000000' fill-opacity='0.1'/%3E%3Cpath d='M40 5l5 5-5 5M80 5l5 5-5 5M5 40l5 5-5 5M5 80l5 5-5 5M115 40l-5 5 5 5M115 80l-5 5 5 5M40 115l5-5-5-5M80 115l5-5-5-5' stroke='%23000000' stroke-width='2' fill='none'/%3E%3Ctext x='30' y='35' font-family='Arial' font-size='20' fill='%23000000' fill-opacity='0.2'%3EPOW!%3C/text%3E%3Ctext x='90' y='35' font-family='Arial' font-size='20' fill='%23000000' fill-opacity='0.2'%3EZAP!%3C/text%3E%3Ctext x='30' y='95' font-family='Arial' font-size='20' fill='%23000000' fill-opacity='0.2'%3EBAM!%3C/text%3E%3Ctext x='90' y='95' font-family='Arial' font-size='20' fill='%23000000' fill-opacity='0.2'%3EZOOM!%3C/text%3E%3C/svg%3E\")",
      icon: <div className="text-xl">💥</div>
    },
    {
      name: "Retro Game",
      value: "url(\"data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cpath fill='%23000000' fill-opacity='0.1' d='M0 0h4v4H0V0zm4 4h4v4H4V4z'/%3E%3Cpath fill='%23000000' fill-opacity='0.1' d='M8 0h4v4H8V0zm4 4h4v4h-4V4z'/%3E%3Cpath fill='%23000000' fill-opacity='0.1' d='M16 0h4v4h-4V0zm4 4h4v4h-4V4z'/%3E%3Cpath fill='%23000000' fill-opacity='0.1' d='M24 0h4v4h-4V0zm4 4h4v4h-4V4z'/%3E%3Cpath fill='%23000000' fill-opacity='0.1' d='M0 8h4v4H0V8zm4 4h4v4H4v-4z'/%3E%3Cpath fill='%23000000' fill-opacity='0.1' d='M8 8h4v4H8V8zm4 4h4v4h-4v-4z'/%3E%3Cpath fill='%23000000' fill-opacity='0.1' d='M16 8h4v4h-4V8zm4 4h4v4h-4v-4z'/%3E%3Cpath fill='%23000000' fill-opacity='0.1' d='M24 8h4v4h-4V8zm4 4h4v4h-4v-4z'/%3E%3Cpath fill='%23000000' fill-opacity='0.1' d='M0 16h4v4H0v-4zm4 4h4v4H4v-4z'/%3E%3Cpath fill='%23000000' fill-opacity='0.1' d='M8 16h4v4H8v-4zm4 4h4v4h-4v-4z'/%3E%3Cpath fill='%23000000' fill-opacity='0.1' d='M16 16h4v4h-4v-4zm4 4h4v4h-4v-4z'/%3E%3Cpath fill='%23000000' fill-opacity='0.1' d='M24 16h4v4h-4v-4zm4 4h4v4h-4v-4z'/%3E%3Cpath fill='%23000000' fill-opacity='0.1' d='M0 24h4v4H0v-4zm4 4h4v4H4v-4z'/%3E%3Cpath fill='%23000000' fill-opacity='0.1' d='M8 24h4v4H8v-4zm4 4h4v4h-4v-4z'/%3E%3Cpath fill='%23000000' fill-opacity='0.1' d='M16 24h4v4h-4v-4zm4 4h4v4h-4v-4z'/%3E%3Cpath fill='%23000000' fill-opacity='0.1' d='M24 24h4v4h-4v-4zm4 4h4v4h-4v-4z'/%3E%3C/g%3E%3C/svg%3E\")",
      icon: <div className="text-xl">🎮</div>
    }
  ];

  // Mouse cursor icons
  const MOUSE_ICONS = [
    { 
      name: "Bag", 
      value: "bag",
      icon: (
        <svg width="14" height="14" viewBox="0 0 512 512" fill="currentColor">
          <path d="M356.174,100.174V33.391h-33.391v66.783H189.217V33.391h-33.391v66.783H55.652V512h400.696V100.174H356.174z" />
        </svg>
      )
    },
    {
      name: "Light Bag",
      value: "light-bag",
      icon: (
        <svg width="14" height="14" viewBox="0 0 512 512" fill="currentColor">
          <path d="M356.174,100.174V33.391h-33.391v66.783H189.217V33.391h-33.391v66.783H55.652V512h400.696V100.174H356.174z" />
          <text x="256" y="300" fontSize="100px" textAnchor="middle" fill="currentColor">🚀</text>
        </svg>
      )
    },
    { 
      name: "Star", 
      value: "star",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0L15.708 7.512L24 9.086L18 15.168L19.416 24L12 19.512L4.584 24L6 15.168L0 9.086L8.292 7.512L12 0Z" />
        </svg>
      )
    },
    { 
      name: "Heart", 
      value: "heart",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      )
    },
    { 
      name: "Circle", 
      value: "circle",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="10" />
        </svg>
      )
    },
    { 
      name: "None", 
      value: "none",
      icon: <CircleSlash size={16} />
    }
  ];

  // Load saved theme, position, and performance settings on component mount
  useEffect(() => {
    try {
      // Load theme
      const savedTheme = localStorage.getItem('y2kTheme');
      if (savedTheme) {
        const theme = JSON.parse(savedTheme);
        // Set default mouseIcon if not present
        if (!theme.mouseIcon) {
          theme.mouseIcon = 'bag';
        }
        setCurrentTheme(theme);
      }
      
      // Load position
      const savedPosition = localStorage.getItem('themeCustomizerPosition');
      if (savedPosition) {
        setPosition(JSON.parse(savedPosition));
      } else {
        // Default to bottom right
        setPosition({ 
          x: window.innerWidth - 80, 
          y: window.innerHeight - 80 
        });
      }
      
      // Load size
      const savedSize = localStorage.getItem('themeCustomizerSize');
      if (savedSize) {
        setSize(JSON.parse(savedSize));
      }
      
      // Load performance profile
      const savedProfile = localStorage.getItem('performanceProfile');
      if (savedProfile) {
        setPerformanceProfile(JSON.parse(savedProfile));
      } else {
        // Import dynamically to avoid SSR issues
        import('@/lib/performance').then(({ detectPerformanceProfile }) => {
          const profile = detectPerformanceProfile();
          setPerformanceProfile(profile);
        });
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  }, []);

  // Handle dragging start for both open and closed states
  const handleMouseDown = (e) => {
    // Dragging is allowed on title bar when open, or the entire button when closed
    if ((isOpen && e.target.closest('.customizer-drag-handle')) || 
        (!isOpen && e.target.closest('#theme-customizer-button'))) {
      e.preventDefault();
      e.stopPropagation();
      
      // Record drag start position
      dragStartPos.current = {
        x: e.clientX,
        y: e.clientY
      };
      
      // Reset movement flag
      hasMoved.current = false;
      
      setIsDragging(true);
      
      const rect = customizerRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };
  
  // Handle dragging for both states
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        // Calculate distance moved since drag start
        const dx = Math.abs(e.clientX - dragStartPos.current.x);
        const dy = Math.abs(e.clientY - dragStartPos.current.y);
        
        // If moved more than 5px in any direction, consider it a drag
        if (dx > 5 || dy > 5) {
          hasMoved.current = true;
        }
        
        // Calculate boundaries based on state - open panel is larger
        const width = isOpen ? size.width : 48; 
        const height = isOpen ? size.height : 48;
        
        // Add padding to keep away from edges
        const minPadding = 10;
        const maxX = window.innerWidth - width - minPadding;
        const maxY = window.innerHeight - height - minPadding;
        
        const newX = Math.max(minPadding, Math.min(maxX, e.clientX - dragOffset.x));
        const newY = Math.max(minPadding, Math.min(maxY, e.clientY - dragOffset.y));
        
        setPosition({ x: newX, y: newY });
      }
      
      // Handle resizing
      if (isResizing) {
        const dx = e.clientX - resizeStart.x;
        const dy = e.clientY - resizeStart.y;
        
        // Calculate new size without min/max constraints
        // Just ensure minimal usable size of 200x200
        const newWidth = Math.max(200, size.width + dx);
        const newHeight = Math.max(200, size.height + dy);
        
        setSize({ width: newWidth, height: newHeight });
        setResizeStart({ x: e.clientX, y: e.clientY });
      }
    };
    
    const handleMouseUp = (e) => {
      if (isDragging) {
        // If this was a click (no significant movement), toggle open/closed
        if (!hasMoved.current && !isOpen) {
          setIsOpen(true);
        }
        
        setIsDragging(false);
        
        // Save position
        localStorage.setItem('themeCustomizerPosition', JSON.stringify(position));
      }
      
      // Handle resize end
      if (isResizing) {
        setIsResizing(false);
        
        // Save size to localStorage
        localStorage.setItem('themeCustomizerSize', JSON.stringify(size));
      }
    };
    
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset, position, isOpen, isResizing, resizeStart, size]);

  // Apply theme changes
  const applyTheme = (theme, pattern = currentTheme.pattern, mouseIcon = currentTheme.mouseIcon, desktopOpacity = currentTheme.desktopOpacity) => {
    // Create full theme object
    const fullTheme = {
      ...theme,
      pattern: pattern,
      mouseIcon: mouseIcon,
      desktopOpacity: desktopOpacity
    };
    
    // Save to localStorage
    localStorage.setItem('y2kTheme', JSON.stringify(fullTheme));
    
    // Update current theme
    setCurrentTheme(fullTheme);
    
    // Create a custom event to notify the CursorWrapper
    const event = new CustomEvent('themeChange', { detail: fullTheme });
    window.dispatchEvent(event);
    
    // Notify parent component
    if (onThemeChange) {
      onThemeChange(fullTheme);
    }
  };

  // Apply pattern
  const applyPattern = (pattern) => {
    applyTheme(currentTheme, pattern, currentTheme.mouseIcon);
  };
  
  // Apply mouse icon
  const applyMouseIcon = (mouseIcon) => {
    applyTheme(currentTheme, currentTheme.pattern, mouseIcon);
  };

  // Performance profile options
  const PERFORMANCE_OPTIONS = [
    {
      name: "High Quality",
      value: "standard",
      icon: "✨",
      description: "Full animations and effects"
    },
    {
      name: "Balanced",
      value: "balanced",
      icon: "⚡",
      description: "Reduced effects for better performance"
    },
    {
      name: "Battery Saver",
      value: "light",
      icon: "🔋",
      description: "Minimal effects to save power"
    },
    {
      name: "Accessibility",
      value: "none",
      icon: "♿",
      description: "No animations for reduced motion"
    }
  ];

  // Apply performance profile changes
  const applyPerformanceProfile = (profileOption) => {
    import('@/lib/performance').then(({ updatePerformanceProfile }) => {
      // Create profile based on selection
      let newProfile = {
        enableAnimations: true,
        enableTransitions: true,
        enableParallax: true,
        enableBackgroundEffects: true,
        cursorProfile: profileOption,
        imageQuality: 'auto'
      };
      
      if (profileOption === 'balanced') {
        newProfile = {
          enableAnimations: true,
          enableTransitions: true,
          enableParallax: false,
          enableBackgroundEffects: false,
          cursorProfile: 'standard',
          imageQuality: 'low'
        };
      } else if (profileOption === 'light') {
        newProfile = {
          enableAnimations: true,
          enableTransitions: true,
          enableParallax: false,
          enableBackgroundEffects: false,
          cursorProfile: 'light',
          imageQuality: 'low'
        };
      } else if (profileOption === 'none') {
        newProfile = {
          enableAnimations: false,
          enableTransitions: true,
          enableParallax: false,
          enableBackgroundEffects: false,
          cursorProfile: 'none',
          imageQuality: 'minimal'
        };
      }
      
      // Save profile
      updatePerformanceProfile(newProfile);
      setPerformanceProfile(newProfile);
      
      // Dispatch event to notify components
      const event = new CustomEvent('performanceChange', { detail: newProfile });
      window.dispatchEvent(event);
    });
  };

  // Handle file upload for custom backgrounds
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target.result;
        // Set the uploaded image as the pattern
        applyPattern(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  // Apply desktop opacity
  const applyDesktopOpacity = (opacity) => {
    applyTheme(currentTheme, currentTheme.pattern, currentTheme.mouseIcon, opacity);
  };

  // Start resize operation
  const handleResizeStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({ x: e.clientX, y: e.clientY });
  };

  // Handle window resize to keep customizer within bounds
  useEffect(() => {
    const handleWindowResize = () => {
      const iconSize = 48; // Size when closed
      const currentWidth = isOpen ? size.width : iconSize;
      const currentHeight = isOpen ? size.height : iconSize;
      
      // Ensure minimum distance from edges (10px padding)
      const minPadding = 10;
      const maxX = window.innerWidth - currentWidth - minPadding;
      const maxY = window.innerHeight - currentHeight - minPadding;
      
      let newPosition = { ...position };
      let updated = false;
      
      // Adjust X position if out of bounds
      if (position.x > maxX) {
        newPosition.x = Math.max(minPadding, maxX);
        updated = true;
      } else if (position.x < minPadding) {
        newPosition.x = minPadding;
        updated = true;
      }
      
      // Adjust Y position if out of bounds
      if (position.y > maxY) {
        newPosition.y = Math.max(minPadding, maxY);
        updated = true;
      } else if (position.y < minPadding) {
        newPosition.y = minPadding;
        updated = true;
      }
      
      if (updated) {
        setPosition(newPosition);
        // Save the new position
        localStorage.setItem('themeCustomizerPosition', JSON.stringify(newPosition));
      }
    };
    
    window.addEventListener('resize', handleWindowResize);
    
    // Also run on mount and when open/close state changes
    handleWindowResize();
    
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [position, size, isOpen]);

  return (
    <div 
      ref={customizerRef}
      id={customizerId}
      className="fixed z-[9999] hidden md:block"
      style={{
        left: position.x,
        top: position.y
      }}
    >
      {/* Hidden file input for image upload */}
      <input 
        type="file" 
        ref={fileInputRef}
        style={{ display: 'none' }} 
        accept="image/*"
        onChange={handleImageUpload}
      />
      
      {/* Icon only when closed */}
      {!isOpen && (
        <button 
          id="theme-customizer-button"
          className="w-12 h-12 flex items-center justify-center rounded-full shadow-[3px_3px_0px_rgba(0,0,0,0.3)] cursor-win-move"
          style={{
            backgroundColor: `#${currentTheme.bgColor}`,
            borderWidth: '2px',
            borderStyle: 'solid', 
            borderColor: `#${currentTheme.borderColor}`,
          }}
          onMouseDown={handleMouseDown}
          title="Theme Customizer"
        >
          <Palette size={24} />
        </button>
      )}
      
      {/* Expanded panel when open */}
      {isOpen && (
        <div 
          className="shadow-[3px_3px_0px_rgba(0,0,0,0.3)] rounded-md overflow-hidden win2k-window relative"
          style={{
            backgroundColor: `#${currentTheme.bgColor}`,
            borderWidth: '2px',
            borderStyle: 'solid',
            borderColor: `#${currentTheme.borderColor}`,
            width: `${size.width}px`,
            height: `${size.height}px`,
            maxHeight: 'calc(90vh - 40px)',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Titlebar - draggable */}
          <div 
            className="h-7 flex items-center justify-between px-2 customizer-drag-handle cursor-win-move"
            style={{
              backgroundColor: `#${currentTheme.borderColor}`,
              color: '#FFFFFF',
            }}
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center">
              <Palette size={14} className="mr-1" />
              <span className="text-xs font-bold">Theme Customizer</span>
            </div>
            <button 
              className="w-4 h-4 flex items-center justify-center bg-gray-200 border border-gray-400 hover:bg-red-200"
              onClick={() => setIsOpen(false)}
            >
              <X size={10} />
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-0">
            <button
              className={`px-3 py-1.5 text-xs font-medium ${activeTab === 'colors' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('colors')}
            >
              <IconPalette size={14} className="inline mr-1" /> Colors
            </button>
            <button
              className={`px-3 py-1.5 text-xs font-medium ${activeTab === 'patterns' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('patterns')}
            >
              <IconWallpaper size={14} className="inline mr-1" /> Patterns
            </button>
            <button
              className={`px-3 py-1.5 text-xs font-medium ${activeTab === 'desktop' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('desktop')}
            >
              <IconPhoto size={14} className="inline mr-1" /> Desktop
            </button>
            <button
              className={`px-3 py-1.5 text-xs font-medium ${activeTab === 'mouse' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('mouse')}
            >
              <IconMouse size={14} className="inline mr-1" /> Mouse
            </button>
            <button
              className={`px-3 py-1.5 text-xs font-medium ${activeTab === 'performance' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('performance')}
            >
              <IconAdjustments size={14} className="inline mr-1" /> Performance
            </button>
          </div>
          
          {/* Tab Content - scrollable */}
          <div className="p-2 overflow-y-auto flex-1">
            {/* Colors Tab */}
            {activeTab === 'colors' && (
              <div className="grid grid-cols-3 gap-2 pt-1">
                {THEMES.map((theme, index) => (
                  <div 
                    key={index}
                    onClick={() => applyTheme(theme)}
                    className={`cursor-pointer relative rounded p-1 flex items-center justify-center h-16 ${
                      currentTheme.borderColor === theme.borderColor && 
                      currentTheme.bgColor === theme.bgColor ? 
                      'ring-1 ring-blue-500' : ''
                    }`}
                    style={{ 
                      backgroundColor: `#${theme.bgColor}`,
                      borderWidth: '2px',
                      borderStyle: 'solid',
                      borderColor: `#${theme.borderColor}`,
                      color: `#${theme.textColor || '000000'}`
                    }}
                  >
                    <span className="text-[10px] text-center font-medium drop-shadow-sm">
                      {theme.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
            
            {/* Patterns Tab */}
            {activeTab === 'patterns' && (
              <div className="grid grid-cols-3 gap-2 overflow-y-auto pt-1">
                {BG_PATTERNS.map((pattern, index) => (
                  <div 
                    key={index}
                    onClick={() => applyPattern(pattern.value)}
                    className={`cursor-pointer rounded p-1.5 flex flex-col items-center justify-center border h-16 ${
                      currentTheme.pattern === pattern.value ? 
                      'ring-1 ring-blue-500 border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      {pattern.icon}
                    </div>
                    <span className="text-[10px] font-medium truncate w-full text-center mt-0.5">
                      {pattern.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
            
            {/* Desktop Tab */}
            {activeTab === 'desktop' && (
              <div className="pt-1">
                <h3 className="text-xs font-medium mb-2">Desktop Backgrounds</h3>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {desktopBackgrounds.map((background) => (
                    <div
                      key={background.value}
                      className={`
                        cursor-pointer p-1 rounded border
                        ${currentTheme.pattern === background.value ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
                      `}
                      onClick={() => applyPattern(background.value)}
                    >
                      <div className="aspect-w-16 aspect-h-9 overflow-hidden rounded">
                        <img 
                          src={background.value} 
                          alt={background.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-[10px] text-center mt-0.5 truncate">{background.name}</div>
                    </div>
                  ))}
                </div>
                
                {/* Desktop Opacity Slider */}
                <div className="mb-3">
                  <h3 className="text-xs font-medium mb-1">Desktop Opacity</h3>
                  <div className="flex items-center">
                    <span className="text-[10px] mr-1">0%</span>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      step="5"
                      value={(currentTheme.desktopOpacity || 0) * 100} 
                      onChange={(e) => {
                        const opacity = parseFloat(e.target.value) / 100;
                        applyDesktopOpacity(opacity);
                      }}
                      className="flex-1 h-3"
                    />
                    <span className="text-[10px] ml-1">100%</span>
                  </div>
                  <div className="text-[10px] text-center mt-1 mb-1 text-gray-500">
                    Current opacity: {Math.round((currentTheme.desktopOpacity || 0) * 100)}%
                  </div>
                  <div className="flex justify-between">
                    <button 
                      onClick={() => applyDesktopOpacity(0)}
                      className={`px-2 py-0.5 text-[10px] border rounded hover:bg-gray-50 ${
                        currentTheme.desktopOpacity === 0 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      No Tint
                    </button>
                    <button 
                      onClick={() => applyDesktopOpacity(0.3)}
                      className={`px-2 py-0.5 text-[10px] border rounded hover:bg-gray-50 ${
                        currentTheme.desktopOpacity === 0.3 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      Light
                    </button>
                    <button 
                      onClick={() => applyDesktopOpacity(0.6)}
                      className={`px-2 py-0.5 text-[10px] border rounded hover:bg-gray-50 ${
                        currentTheme.desktopOpacity === 0.6 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      Medium
                    </button>
                    <button 
                      onClick={() => applyDesktopOpacity(1)}
                      className={`px-2 py-0.5 text-[10px] border rounded hover:bg-gray-50 ${
                        currentTheme.desktopOpacity === 1 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      Full
                    </button>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xs font-medium mb-1">Upload Custom Image</h3>
                  <label
                    className="block w-full px-2 py-1.5 text-[10px] text-center border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50"
                  >
                    <IconCloudUpload size={14} className="inline mr-1" />
                    Choose Image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                  {currentTheme.pattern && currentTheme.pattern.startsWith('data:image/') && (
                    <div className="mt-2">
                      <div className="text-[10px] text-gray-500 mb-1">Current custom image:</div>
                      <div className="aspect-w-16 aspect-h-9 overflow-hidden rounded border border-gray-300">
                        <img 
                          src={currentTheme.pattern} 
                          alt="Custom background"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                <button
                  className="mt-2 px-2 py-1 text-[10px] border border-gray-200 rounded hover:bg-gray-50 w-full"
                  onClick={() => applyTheme(currentTheme, 'none', 'bag')}
                >
                  No Background
                </button>
              </div>
            )}
            
            {/* Mouse Tab */}
            {activeTab === 'mouse' && (
              <div className="grid grid-cols-3 gap-2 pt-1">
                {MOUSE_ICONS.map((mouseIcon, index) => (
                  <div 
                    key={index}
                    onClick={() => applyMouseIcon(mouseIcon.value)}
                    className={`cursor-pointer rounded p-1.5 flex flex-col items-center justify-center border h-16 ${
                      currentTheme.mouseIcon === mouseIcon.value ? 
                      'ring-1 ring-blue-500 border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      {mouseIcon.icon}
                    </div>
                    <span className="text-[10px] font-medium truncate w-full text-center mt-0.5">
                      {mouseIcon.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
            
            {/* Performance Tab */}
            {activeTab === 'performance' && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                {PERFORMANCE_OPTIONS.map((option, index) => (
                  <div 
                    key={index}
                    onClick={() => applyPerformanceProfile(option.value)}
                    className={`cursor-pointer rounded p-1.5 flex flex-col items-center justify-center border h-16 ${
                      performanceProfile?.cursorProfile === option.value ? 
                      'ring-1 ring-blue-500 border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-xl">
                      {option.icon}
                    </div>
                    <span className="text-[10px] font-medium truncate w-full text-center mt-0.5">
                      {option.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Resize handle - outside the scrollable area */}
          <div 
            className="absolute bottom-0 right-0 w-10 h-10 cursor-nwse-resize z-10 flex items-end justify-end p-1"
            onMouseDown={handleResizeStart}
            title="Drag to resize"
          >
            <svg width="8" height="8" viewBox="0 0 8 8" className="opacity-70">
              <path d="M6.5,1 L1,6.5 M7.5,2 L2,7.5 M7.5,4 L4,7.5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloatingThemeCustomizer;