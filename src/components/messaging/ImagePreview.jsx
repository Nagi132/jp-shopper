import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

/**
 * Enhanced image preview component
 */
export default function ImagePreview({ imageUrl, onCancel }) {
  if (!imageUrl) return null;
  
  return (
    <div className="image-preview mb-4 relative border rounded-md p-2 bg-gray-50">
      <img
        src={imageUrl}
        alt="Selected image"
        className="w-full max-h-60 object-contain rounded-md"
      />
      <Button
        variant="outline"
        size="sm"
        className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm rounded-full h-8 w-8 p-0 flex items-center justify-center shadow-sm hover:bg-red-50 border-gray-200"
        onClick={onCancel}
      >
        <X className="h-4 w-4 text-gray-500" />
      </Button>
    </div>
  );
}