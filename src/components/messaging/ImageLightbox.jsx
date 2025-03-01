import React from 'react';
import { X, ExternalLink } from 'lucide-react';

/**
 * Enhanced fullscreen image lightbox
 */
export default function ImageLightbox({ imageUrl, onClose }) {
  if (!imageUrl) return null;
  
  return (
    <div
      className="lightbox fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-4xl max-h-[90vh] w-full">
        <img
          src={imageUrl}
          alt="Full size attachment"
          className="lightbox-image object-contain w-full h-full max-h-[80vh] rounded-lg"
        />
        <button
          className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white 
                     rounded-full w-10 h-10 flex items-center justify-center 
                     hover:bg-black/70 transition-all"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          <X className="h-5 w-5" />
        </button>
        <button
          className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm text-white 
                     rounded-md px-4 py-2 flex items-center gap-2
                     hover:bg-black/70 transition-all text-sm font-medium"
          onClick={(e) => {
            e.stopPropagation();
            window.open(imageUrl, '_blank');
          }}
        >
          <ExternalLink className="h-4 w-4" />
          Open in new tab
        </button>
      </div>
    </div>
  );
}