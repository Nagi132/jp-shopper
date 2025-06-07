'use client';

import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import { Info, AlertTriangle, X, AlertCircle, HelpCircle, Check, CheckCircle } from 'lucide-react';

/**
 * MessageBox - A Windows 2000 style message box component
 * 
 * Features:
 * - Various message types (info, warning, error, question)
 * - Customizable buttons
 * - Keyboard navigation and shortcuts
 * - Focus trapping
 * - Animated appearance
 */
export function MessageBox({
  title = 'Message',
  message,
  type = 'info',
  buttons = ['OK'],
  onClose,
  onButtonClick,
  theme = {},
  disableEscapeKey = false
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [activeButton, setActiveButton] = useState(0);
  const messageBoxRef = useRef(null);
  const buttonRefs = useRef([]);
  
  // Get theme colors or use defaults
  const borderColor = theme?.borderColor || '69EFD7';
  const bgColor = theme?.bgColor || 'FED1EB';
  
  // Set visible state after component mounts (for animation)
  useEffect(() => {
    // Small delay to allow DOM to render for animation
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 10);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Set up keyboard event listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'Escape':
          if (!disableEscapeKey) {
            e.preventDefault();
            onButtonClick?.(buttons[buttons.length - 1]);
            onClose?.();
          }
          break;
        case 'Enter':
          e.preventDefault();
          onButtonClick?.(buttons[activeButton]);
          onClose?.();
          break;
        case 'ArrowRight':
        case 'Tab':
          if (!e.shiftKey) {
            e.preventDefault();
            setActiveButton(prev => (prev + 1) % buttons.length);
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setActiveButton(prev => (prev - 1 + buttons.length) % buttons.length);
          break;
        case 'Tab':
          if (e.shiftKey) {
            e.preventDefault();
            setActiveButton(prev => (prev - 1 + buttons.length) % buttons.length);
          }
          break;
      }
    };
    
    // Add event listeners
    if (messageBoxRef.current) {
      messageBoxRef.current.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      if (messageBoxRef.current) {
        messageBoxRef.current.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [activeButton, buttons, disableEscapeKey, onButtonClick, onClose]);
  
  // Focus the active button when it changes
  useEffect(() => {
    if (buttonRefs.current[activeButton]) {
      buttonRefs.current[activeButton].focus();
    }
  }, [activeButton]);
  
  // Set up focus trapping
  useEffect(() => {
    const handleTabKey = (e) => {
      if (e.key === 'Tab') {
        // This is handled in the main keydown handler
        e.preventDefault();
      }
    };
    
    document.addEventListener('keydown', handleTabKey);
    
    // Focus the first button by default
    if (buttonRefs.current[0]) {
      buttonRefs.current[0].focus();
    }
    
    return () => {
      document.removeEventListener('keydown', handleTabKey);
    };
  }, []);
  
  // Get icon based on message type
  const getIcon = () => {
    switch (type) {
      case 'info':
        return <Info className="h-8 w-8 text-blue-500" />;
      case 'warning':
        return <AlertTriangle className="h-8 w-8 text-amber-500" />;
      case 'error':
        return <AlertCircle className="h-8 w-8 text-red-500" />;
      case 'question':
        return <HelpCircle className="h-8 w-8 text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      default:
        return <Info className="h-8 w-8 text-blue-500" />;
    }
  };
  
  // Get the corresponding Windows sound
  useEffect(() => {
    // Play sound on mount based on message type
    const playSound = () => {
      // Create audio element for sound
      const audio = new Audio();
      
      switch (type) {
        case 'info':
        case 'question':
          audio.src = '/sounds/windows-ding.mp3'; // Windows Ding sound
          break;
        case 'warning':
          audio.src = '/sounds/windows-exclamation.mp3'; // Windows Exclamation sound
          break;
        case 'error':
          audio.src = '/sounds/windows-critical-stop.mp3'; // Windows Critical Stop sound
          break;
        case 'success':
          audio.src = '/sounds/windows-notify.mp3'; // Windows Notify sound
          break;
      }
      
      // Try to play the sound
      audio.play().catch(err => {
        // Ignore errors from browsers that block autoplay
        console.log('Audio play was prevented:', err);
      });
    };
    
    playSound();
  }, [type]);
  
  // Handle button click
  const handleButtonClick = (button) => {
    onButtonClick?.(button);
    onClose?.();
  };
  
  // Special styling for default button (first button)
  const isDefaultButton = (index) => index === 0;
  
  // Calculate message box width based on content length
  const getMessageBoxWidth = () => {
    const messageLength = message.length;
    const titleLength = title.length;
    const maxLength = Math.max(messageLength, titleLength);
    
    if (maxLength < 50) return 320;
    if (maxLength < 100) return 380;
    if (maxLength < 200) return 440;
    return 500;
  };
  
  const width = getMessageBoxWidth();
  
  // Main render
  const messageBox = (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      style={{ transition: 'opacity 0.15s ease-in' }}
    >
      {/* Backdrop with classic Windows 2000 blue pattern */}
      <div 
        className="absolute inset-0 bg-blue-600 bg-opacity-50 backdrop-blur-sm"
        onClick={!disableEscapeKey ? onClose : undefined}
        style={{ 
          cursor: disableEscapeKey ? 'default' : 'pointer',
          backgroundColor: type === 'error' ? 'rgba(220, 38, 38, 0.2)' : 'rgba(37, 99, 235, 0.2)', 
          backdropFilter: 'blur(1px)'
        }}
      />
      
      {/* Message box container */}
      <div
        ref={messageBoxRef}
        className={`bg-white border shadow-md ${isVisible ? 'transform-none' : 'translate-y-4'}`}
        style={{ 
          width: `${width}px`,
          maxWidth: '95vw',
          borderWidth: '2px',
          borderStyle: 'solid',
          borderColor: `#${borderColor}`,
          transition: 'transform 0.2s ease-out',
          boxShadow: '4px 4px 10px rgba(0, 0, 0, 0.3)',
        }}
        tabIndex={-1}
        role="dialog"
        aria-labelledby="message-box-title"
        aria-describedby="message-box-message"
      >
        {/* Title bar */}
        <div 
          className="flex items-center justify-between px-2 py-1"
          style={{ 
            backgroundColor: `#${borderColor}`,
            color: '#FFFFFF',
          }}
          id="message-box-title"
        >
          <div className="font-bold text-sm select-none truncate">{title}</div>
          {!disableEscapeKey && (
            <button
              className="w-5 h-5 flex items-center justify-center hover:bg-white/20 rounded-sm"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={12} />
            </button>
          )}
        </div>
        
        {/* Message content */}
        <div className="p-6 flex items-start">
          <div className="mr-4 mt-1">
            {getIcon()}
          </div>
          <div 
            className="flex-1 text-sm"
            style={{ maxHeight: '60vh', overflowY: 'auto' }}
            id="message-box-message"
          >
            {message}
          </div>
        </div>
        
        {/* Buttons */}
        <div 
          className="flex justify-end p-3 gap-2 border-t"
          style={{ backgroundColor: `#${bgColor}20` }}
        >
          {buttons.map((button, index) => (
            <button
              key={button}
              ref={(el) => buttonRefs.current[index] = el}
              className={`px-4 py-1 min-w-20 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                activeButton === index ? 'ring-2 ring-blue-500' : ''
              } ${
                isDefaultButton(index) 
                  ? 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700' 
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200 active:bg-gray-300'
              }`}
              onClick={() => handleButtonClick(button)}
              style={{
                borderRadius: '0',
                boxShadow: '2px 2px 1px rgba(0, 0, 0, 0.1)',
              }}
            >
              {button}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
  
  // Use a portal to render the message box at the root level
  return createPortal(messageBox, document.body);
}

/**
 * InputDialog - A Windows 2000 style input dialog
 * 
 * Features:
 * - Text input field
 * - OK/Cancel buttons
 * - Validation
 */
export function InputDialog({
  title = 'Input',
  message,
  defaultValue = '',
  placeholder = '',
  onSubmit,
  onCancel,
  theme = {},
  validator = (val) => true,
  maskInput = false
}) {
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const inputRef = useRef(null);
  
  // Get theme colors or use defaults
  const borderColor = theme?.borderColor || '69EFD7';
  const bgColor = theme?.bgColor || 'FED1EB';
  
  // Set visible state after component mounts (for animation)
  useEffect(() => {
    // Small delay to allow DOM to render for animation
    const timer = setTimeout(() => {
      setIsVisible(true);
      
      // Focus the input field
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, 10);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Handle input change
  const handleChange = (e) => {
    setValue(e.target.value);
    setError('');
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate the input
    try {
      const isValid = validator(value);
      if (isValid === true) {
        onSubmit?.(value);
      } else {
        setError(isValid || 'Invalid input');
      }
    } catch (err) {
      setError(err.message || 'Validation error');
    }
  };
  
  // Handle cancel
  const handleCancel = () => {
    onCancel?.();
  };
  
  // Main render
  const inputDialog = (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      style={{ transition: 'opacity 0.15s ease-in' }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-blue-600 bg-opacity-50 backdrop-blur-sm"
        onClick={handleCancel}
      />
      
      {/* Dialog container */}
      <div
        className={`bg-white border shadow-md w-96 max-w-full ${isVisible ? 'transform-none' : 'translate-y-4'}`}
        style={{ 
          borderWidth: '2px',
          borderStyle: 'solid',
          borderColor: `#${borderColor}`,
          transition: 'transform 0.2s ease-out',
          boxShadow: '4px 4px 10px rgba(0, 0, 0, 0.3)',
        }}
        role="dialog"
        aria-labelledby="input-dialog-title"
      >
        {/* Title bar */}
        <div 
          className="flex items-center justify-between px-2 py-1"
          style={{ 
            backgroundColor: `#${borderColor}`,
            color: '#FFFFFF',
          }}
          id="input-dialog-title"
        >
          <div className="font-bold text-sm select-none">{title}</div>
          <button
            className="w-5 h-5 flex items-center justify-center hover:bg-white/20 rounded-sm"
            onClick={handleCancel}
            aria-label="Close"
          >
            <X size={12} />
          </button>
        </div>
        
        {/* Form content */}
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            {message && (
              <div className="mb-4 text-sm">{message}</div>
            )}
            
            <input
              ref={inputRef}
              type={maskInput ? 'password' : 'text'}
              value={value}
              onChange={handleChange}
              placeholder={placeholder}
              className="w-full border p-2 text-sm focus:border-blue-500 focus:outline-none"
              style={{ borderRadius: '0' }}
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={error ? 'input-error' : undefined}
            />
            
            {error && (
              <div id="input-error" className="mt-2 text-sm text-red-600">{error}</div>
            )}
          </div>
          
          {/* Buttons */}
          <div 
            className="flex justify-end p-3 gap-2 border-t"
            style={{ backgroundColor: `#${bgColor}20` }}
          >
            <button
              type="button"
              className="px-4 py-1 min-w-20 text-sm bg-gray-100 text-gray-800 hover:bg-gray-200 active:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={handleCancel}
              style={{
                borderRadius: '0',
                boxShadow: '2px 2px 1px rgba(0, 0, 0, 0.1)',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1 min-w-20 text-sm bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                borderRadius: '0',
                boxShadow: '2px 2px 1px rgba(0, 0, 0, 0.1)',
              }}
            >
              OK
            </button>
          </div>
        </form>
      </div>
    </div>
  );
  
  // Use a portal to render the dialog at the root level
  return createPortal(inputDialog, document.body);
}

/**
 * DialogManager - A context provider and hook for managing dialogs
 * 
 * Usage:
 * 1. Wrap your app with DialogProvider
 * 2. Use the useDialog hook to show message boxes and dialogs
 */
const DialogContext = React.createContext(null);

export function DialogProvider({ children, theme = {} }) {
  const [messageBoxProps, setMessageBoxProps] = useState(null);
  const [inputDialogProps, setInputDialogProps] = useState(null);
  
  // Function to show a message box
  const showMessageBox = (props) => {
    return new Promise((resolve) => {
      setMessageBoxProps({
        ...props,
        onButtonClick: (button) => {
          resolve(button);
          setMessageBoxProps(null);
        },
        onClose: () => {
          resolve(null);
          setMessageBoxProps(null);
        }
      });
    });
  };
  
  // Shorthand functions for common message box types
  const showInfo = (message, title = 'Information', buttons = ['OK']) => {
    return showMessageBox({ title, message, type: 'info', buttons });
  };
  
  const showWarning = (message, title = 'Warning', buttons = ['OK']) => {
    return showMessageBox({ title, message, type: 'warning', buttons });
  };
  
  const showError = (message, title = 'Error', buttons = ['OK'], callback = null) => {
    return showMessageBox({
      title,
      message,
      type: 'error',
      buttons,
      disableEscapeKey: false, // Allow escape key to dismiss errors
      onButtonClick: (button) => {
        if (callback) callback(button);
      }
    });
  };
  
  const showQuestion = (message, title = 'Question', buttons = ['Yes', 'No']) => {
    return showMessageBox({ title, message, type: 'question', buttons });
  };
  
  const showConfirm = (message, title = 'Confirm', buttons = ['OK', 'Cancel']) => {
    return showMessageBox({ title, message, type: 'question', buttons });
  };
  
  // Function to show an input dialog
  const showInputDialog = (props) => {
    return new Promise((resolve) => {
      setInputDialogProps({
        ...props,
        onSubmit: (value) => {
          resolve(value);
          setInputDialogProps(null);
        },
        onCancel: () => {
          resolve(null);
          setInputDialogProps(null);
        }
      });
    });
  };
  
  // Show success dialog
  const showSuccess = (title, message, callback = null) => {
    return showMessageBox({
      title,
      message,
      type: 'success',
      buttons: ['OK'],
      callback,
    });
  };
  
  // Provide the dialog functions through context
  const contextValue = {
    showMessageBox,
    showInfo,
    showWarning,
    showError,
    showQuestion,
    showConfirm,
    showInputDialog,
    showSuccess,
  };
  
  return (
    <DialogContext.Provider value={contextValue}>
      {children}
      
      {/* Render active dialogs */}
      {messageBoxProps && <MessageBox {...messageBoxProps} theme={theme} />}
      {inputDialogProps && <InputDialog {...inputDialogProps} theme={theme} />}
    </DialogContext.Provider>
  );
}

/**
 * useDialog - Hook for using the dialog system
 * 
 * Example usage:
 * 
 * const { showInfo, showConfirm, showInputDialog } = useDialog();
 * 
 * // Show a simple info message
 * showInfo('This is an informational message');
 * 
 * // Ask for confirmation
 * const result = await showConfirm('Are you sure?');
 * if (result === 'OK') {
 *   // User confirmed
 * }
 * 
 * // Ask for input
 * const name = await showInputDialog({
 *   title: 'Enter Name',
 *   message: 'Please enter your name:',
 *   defaultValue: 'John',
 * });
 * if (name) {
 *   // User entered a name
 * }
 */
export function useDialog() {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
}