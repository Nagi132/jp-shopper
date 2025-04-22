'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useTheme } from '@/components/layouts/ThemeProvider';
import { useApp } from '@/contexts/AppContext';
import { useDialog } from '@/components/windows/MessageBox';
import { 
  Loader2, AlertCircle, X, Image, Plus, ArrowLeft, Save, DollarSign, FileText
} from 'lucide-react';

/**
 * NewRequestPage - Windows-styled component for creating new requests
 * Used in both Window and standalone contexts
 */
const NewRequestPage = ({ isWindowView = true }) => {
  const [user, setUser] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  const router = useRouter();
  const { theme } = useTheme();
  const { openWindow } = useApp();
  const { showConfirm, showInfo, showError } = useDialog();
  
  // Get theme colors
  const borderColor = theme?.borderColor || '69EFD7';
  const bgColor = theme?.bgColor || 'FED1EB';
  
  // Determine text color based on background color
  const getContrastText = (hexColor) => {
    // Convert hex to RGB
    const r = parseInt(hexColor.substr(0, 2), 16);
    const g = parseInt(hexColor.substr(2, 2), 16);
    const b = parseInt(hexColor.substr(4, 2), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return black for light colors, white for dark
    return luminance > 0.5 ? '000000' : 'FFFFFF';
  };
  
  const textColor = theme?.textColor || getContrastText(bgColor);

  // Check if user is logged in
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!isWindowView) {
          router.push('/login');
        }
      } else {
        setUser(user);
      }
    };

    getUser();
  }, [router, isWindowView]);

  // Handle file upload
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setUploading(true);
    setError(null);
    
    try {
      for (const file of files) {
        // Check file size
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          setError('File size exceeds limit (5MB)');
          continue;
        }
        
        // Create a unique file name
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `${fileName}`;
        
        // Upload the file to Supabase storage
        const { data, error } = await supabase.storage
          .from('request-images')
          .upload(filePath, file);
          
        if (error) {
          throw error;
        }
        
        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('request-images')
          .getPublicUrl(filePath);
        
        // Add the URL to our images array
        setImages(prev => [...prev, publicUrl]);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };
  
  // Remove image
  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // Submit the form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!title.trim()) {
      setError('Please enter a title for your request');
      return;
    }
    
    // Confirm submission
    const confirmResult = await showConfirm('Are you sure you want to create this request?');
    if (confirmResult !== 'OK') return;
    
    setSubmitting(true);
    setError(null);
    
    try {
      const formattedBudget = budget ? parseFloat(budget) : null;
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      // Insert the request
      const { data, error } = await supabase.from('requests').insert([
        {
          customer_id: user.id,
          title: title.trim(),
          description: description.trim(),
          budget: formattedBudget,
          status: 'open',
          images: images,
        },
      ]).select();
      
      if (error) throw error;
      
      // Show success message
      showInfo('Your request has been created successfully!');
      
      // Navigate back to the requests list
      if (isWindowView) {
        // Close this window and open requests window
        openWindow('requests', 'RequestsPage', 'My Requests', true);
      } else {
        router.push('/requests');
      }
      
    } catch (error) {
      console.error('Error creating request:', error);
      setError(error.message || 'Failed to create request');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Go back
  const handleGoBack = () => {
    // Check if form has changes first
    if (title || description || budget || images.length > 0) {
      showConfirm('Discard changes and go back?').then(result => {
        if (result === 'OK') {
          if (isWindowView) {
            // Close this window and open requests window
            openWindow('requests', 'RequestsPage', 'My Requests', true);
          } else {
            router.push('/requests');
          }
        }
      });
    } else {
      if (isWindowView) {
        // Close this window and open requests window
        openWindow('requests', 'RequestsPage', 'My Requests', true);
      } else {
        router.push('/requests');
      }
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div 
        className="py-2 px-4 flex items-center justify-between border-b"
        style={{ 
          backgroundColor: `#${bgColor}30`, 
          borderColor: `#${borderColor}40` 
        }}
      >
        <div className="flex items-center">
          <button
            className="w-7 h-7 flex items-center justify-center rounded-sm mr-2"
            style={{ 
              backgroundColor: `#${borderColor}20`,
              color: `#${borderColor}`,
              border: `1px solid #${borderColor}40`
            }}
            onClick={handleGoBack}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h2 className="text-lg font-medium">Create New Request</h2>
        </div>
        
        <button
          className="flex items-center px-3 py-1.5 text-sm rounded-sm"
          style={{ 
            backgroundColor: `#${borderColor}`,
            color: getContrastText(borderColor) === '000000' ? '#000000' : '#FFFFFF',
            border: `1px solid #${borderColor}`,
            boxShadow: '1px 1px 0 rgba(0,0,0,0.1)'
          }}
          onClick={handleSubmit}
          disabled={submitting || !title.trim()}
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-1" />
              Create Request
            </>
          )}
        </button>
      </div>
      
      {/* Content area with scroll */}
      <div className="flex-1 overflow-auto">
        <form className="p-4 space-y-6" onSubmit={handleSubmit}>
          {/* Error notification */}
          {error && (
            <div 
              className="p-3 rounded-sm flex items-center"
              style={{ 
                backgroundColor: '#FEE2E2', 
                borderLeft: '4px solid #EF4444' 
              }}
            >
              <AlertCircle className="w-5 h-5 mr-2 text-red-500" />
              <p className="text-red-700">{error}</p>
            </div>
          )}
          
          {/* Title field */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Request Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Pokemon TCG Charizard Card"
              className="w-full px-3 py-2 text-sm border rounded-sm"
              style={{ borderColor: `#${borderColor}40` }}
              required
            />
          </div>
          
          {/* Description field */}
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center">
              <FileText className="w-4 h-4 mr-1" />
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide details about what you're looking for, including specific versions, conditions, or other requirements."
              className="w-full px-3 py-2 text-sm border rounded-sm"
              style={{ borderColor: `#${borderColor}40` }}
              rows={5}
            />
          </div>
          
          {/* Budget field */}
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center">
              <DollarSign className="w-4 h-4 mr-1" />
              Budget (¥)
            </label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="Your maximum budget in Japanese Yen"
              className="w-full px-3 py-2 text-sm border rounded-sm"
              style={{ borderColor: `#${borderColor}40` }}
            />
            <p className="text-xs mt-1 opacity-70">Leave blank if flexible or unknown</p>
          </div>
          
          {/* Image upload */}
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center">
              <Image className="w-4 h-4 mr-1" />
              Reference Images
            </label>
            
            <div 
              className="p-3 border rounded-sm"
              style={{ borderColor: `#${borderColor}40` }}
            >
              <div className="flex items-center mb-2">
                <label 
                  className="flex items-center px-3 py-1.5 text-sm rounded-sm cursor-pointer"
                  style={{ 
                    backgroundColor: `#${borderColor}20`,
                    color: `#${borderColor}`,
                    border: `1px solid #${borderColor}40`
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Images
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                </label>
                
                {uploading && (
                  <div className="ml-3 flex items-center text-sm">
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Uploading...
                  </div>
                )}
              </div>
              
              <p className="text-xs opacity-70 mb-3">
                Upload images to help shoppers find exactly what you want (max 5MB per image)
              </p>
              
              {/* Image previews */}
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {images.map((url, index) => (
                    <div 
                      key={index}
                      className="relative border rounded-sm overflow-hidden"
                      style={{ borderColor: `#${borderColor}40` }}
                    >
                      <img
                        src={url}
                        alt={`Reference ${index + 1}`}
                        className="w-full h-24 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 p-1 rounded-full bg-white bg-opacity-80 shadow-sm"
                        style={{ color: '#EF4444' }}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {images.length === 0 && (
                <div 
                  className="border-2 border-dashed rounded-sm p-8 text-center"
                  style={{ borderColor: `#${borderColor}40` }}
                >
                  <p className="text-sm opacity-70">No images added yet</p>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
      
      {/* Status bar */}
      <div 
        className="h-5 text-xs px-2 flex items-center"
        style={{ 
          backgroundColor: `#${bgColor}20`,
          borderTop: `1px solid #${borderColor}40`
        }}
      >
        <span>
          {submitting ? 'Creating request...' : 'Ready'}
        </span>
      </div>
    </div>
  );
};

export default NewRequestPage;