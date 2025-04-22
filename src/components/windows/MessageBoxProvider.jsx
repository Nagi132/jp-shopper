'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Info, XCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Create context
const MessageBoxContext = createContext(null);

// Message type icons
const ICONS = {
  info: <Info className="w-8 h-8 text-blue-500" />,
  warning: <AlertTriangle className="w-8 h-8 text-amber-500" />,
  error: <XCircle className="w-8 h-8 text-red-500" />,
  success: <CheckCircle className="w-8 h-8 text-green-500" />
};

export function MessageBoxProvider({ children }) {
  const [messageBoxes, setMessageBoxes] = useState([]);
  const [counter, setCounter] = useState(0);

  // Show a message box
  const showMessageBox = useCallback(({ 
    title = 'Message', 
    message, 
    type = 'info', 
    buttons = ['OK'],
    defaultButton = 0,
    callback = () => {}
  }) => {
    const id = counter;
    setCounter(prev => prev + 1);
    
    setMessageBoxes(prev => [...prev, {
      id,
      title,
      message,
      type,
      buttons,
      defaultButton,
      callback
    }]);
    
    return id;
  }, [counter]);
  
  // Close a message box
  const closeMessageBox = useCallback((id, buttonIndex) => {
    setMessageBoxes(prev => {
      const box = prev.find(b => b.id === id);
      if (box && typeof box.callback === 'function') {
        box.callback(buttonIndex);
      }
      return prev.filter(box => box.id !== id);
    });
  }, []);
  
  return (
    <MessageBoxContext.Provider value={{ showMessageBox, closeMessageBox }}>
      {children}
      
      {/* Message Box Portal */}
      {typeof document !== 'undefined' && createPortal(
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
          {messageBoxes.map((box) => (
            <MessageBox 
              key={box.id}
              box={box}
              onClose={(buttonIndex) => closeMessageBox(box.id, buttonIndex)}
            />
          ))}
        </div>,
        document.body
      )}
    </MessageBoxContext.Provider>
  );
}

// Individual Message Box component
function MessageBox({ box, onClose }) {
  const { title, message, type, buttons, defaultButton } = box;
  
  // Focus the default button when the component mounts
  const buttonRefs = buttons.map(() => React.useRef(null));
  
  React.useEffect(() => {
    if (buttonRefs[defaultButton]?.current) {
      buttonRefs[defaultButton].current.focus();
    }
  }, []);
  
  return (
    <div 
      className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        // Only close if clicking the backdrop
        if (e.target === e.currentTarget) {
          onClose(defaultButton);
        }
      }}
    >
      <div 
        className="w-full max-w-md border-2 shadow-md"
        style={{
          backgroundColor: '#ECE9D8',
          borderColor: '#0A246A'
        }}
      >
        {/* Title bar */}
        <div 
          className="px-4 py-1 flex items-center justify-between text-white font-medium"
          style={{ backgroundColor: '#0A246A' }}
        >
          <div className="text-sm">{title}</div>
        </div>
        
        {/* Content */}
        <div className="p-4">
          <div className="flex space-x-4">
            {/* Icon */}
            <div className="flex-shrink-0">
              {ICONS[type] || ICONS.info}
            </div>
            
            {/* Message */}
            <div className="flex-1 mt-1">
              {message}
            </div>
          </div>
          
          {/* Buttons */}
          <div className="flex justify-end space-x-2 mt-6">
            {buttons.map((buttonText, index) => (
              <Button
                key={index}
                ref={buttonRefs[index]}
                variant="outline"
                className="min-w-24 focus:ring-2 focus:ring-offset-1"
                style={{
                  backgroundColor: '#D4D0C8',
                  borderColor: '#888888',
                  color: '#000000',
                  boxShadow: '2px 2px 0 #FFFFFF inset, -2px -2px 0 #808080 inset'
                }}
                onClick={() => onClose(index)}
              >
                {buttonText}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Custom hook to use the message box
export function useMessageBox() {
  const context = useContext(MessageBoxContext);
  if (!context) {
    throw new Error('useMessageBox must be used within a MessageBoxProvider');
  }
  return context;
}

// Utility functions for common message boxes
export function useMessageBoxUtils() {
  const { showMessageBox } = useMessageBox();
  
  return {
    // Show an information message
    info: (message, title = 'Information', callback) => {
      return showMessageBox({
        title,
        message,
        type: 'info',
        callback
      });
    },
    
    // Show a warning message
    warning: (message, title = 'Warning', callback) => {
      return showMessageBox({
        title,
        message,
        type: 'warning',
        callback
      });
    },
    
    // Show an error message
    error: (message, title = 'Error', callback) => {
      return showMessageBox({
        title,
        message,
        type: 'error',
        callback
      });
    },
    
    // Show a success message
    success: (message, title = 'Success', callback) => {
      return showMessageBox({
        title,
        message,
        type: 'success',
        callback
      });
    },
    
    // Show a confirmation dialog
    confirm: (message, title = 'Confirm', callback) => {
      return showMessageBox({
        title,
        message,
        type: 'warning',
        buttons: ['Yes', 'No'],
        defaultButton: 0,
        callback: (index) => {
          if (callback) callback(index === 0);
        }
      });
    }
  };
}
