import React, { useState, useEffect } from 'react';
import { Check, X, Upload } from 'lucide-react';
import { WindowButton } from '@/components/ui/window-button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { WindowContainer } from '@/components/ui/window-container';
import { useTheme } from '@/components/layouts/ThemeProvider';

// Predefined color schemes (matching FloatingThemeCustomizer)
const COLOR_SCHEMES = [
  { name: 'Mint & Pink', bgColor: 'FED1EB', borderColor: '69EFD7', textColor: '000000', buttonBgColor: 'FED1EB' },
  { name: 'Cyber Neon', bgColor: '51F5FF', borderColor: 'FE66FE', textColor: '000000', buttonBgColor: '51F5FF' },
  { name: 'Vaporwave', bgColor: '293EFE', borderColor: 'E7F227', textColor: 'FFFFFF', buttonBgColor: '293EFE' },
  { name: 'Kawaii', bgColor: 'D6FDFF', borderColor: 'FF80D5', textColor: '000000', buttonBgColor: 'D6FDFF' },
  { name: 'Millennium', bgColor: 'F5F5DC', borderColor: 'FFD700', textColor: '000000', buttonBgColor: 'F5F5DC' },
  { name: 'Pixel Pop', bgColor: 'E6E6FA', borderColor: '9966FF', textColor: '000000', buttonBgColor: 'E6E6FA' },
];

// Available patterns
const PATTERNS = [
  { name: 'None', value: 'none' },
  { name: 'Grid', value: 'linear-gradient(#00000010 1px, transparent 1px), linear-gradient(90deg, #00000010 1px, transparent 1px)' },
  { name: 'Dots', value: 'radial-gradient(#00000015 1px, transparent 1px)' },
  { name: 'Lines', value: 'repeating-linear-gradient(45deg, #00000008, #00000008 1px, transparent 1px, transparent 10px)' },
];

// Desktop backgrounds (from public/desktop folder - matching FloatingThemeCustomizer)
const DESKTOP_BACKGROUNDS = [
  { name: 'None', value: 'none' },
  { name: 'Desktop 1', value: '/desktop/1.jpg' },
  { name: 'Desktop 2', value: '/desktop/2.jpg' },
  { name: 'Desktop 3', value: '/desktop/3.jpg' },
  { name: 'Desktop 4 (Animated)', value: '/desktop/4.gif' },
  { name: 'Desktop 5', value: '/desktop/5.jpg' },
];

export default function PersonalizationDialog({ onClose, isMobile = false }) {
  const { theme, setTheme } = useTheme();
  const [selectedScheme, setSelectedScheme] = useState('Custom');
  const fileInputRef = React.useRef(null);
  const [customTheme, setCustomTheme] = useState({ ...theme });
  const [selectedPattern, setSelectedPattern] = useState(
    PATTERNS.find(p => p.value === theme.pattern)?.name || 'None'
  );

  // Update custom theme when user selects a preset
  useEffect(() => {
    if (selectedScheme !== 'Custom') {
      const scheme = COLOR_SCHEMES.find(s => s.name === selectedScheme);
      if (scheme) {
        setCustomTheme({
          ...customTheme,
          ...scheme
        });
      }
    }
  }, [selectedScheme]);

  // Update the pattern when selected
  useEffect(() => {
    const pattern = PATTERNS.find(p => p.name === selectedPattern);
    if (pattern) {
      setCustomTheme({
        ...customTheme,
        pattern: pattern.value
      });
    }
  }, [selectedPattern]);

  // Apply theme changes
  const handleApply = () => {
    setTheme(customTheme);
    onClose();
  };

  // Handle custom color input change
  const handleColorChange = (field, value) => {
    // Ensure we're in custom mode
    setSelectedScheme('Custom');
    
    // Update the color
    setCustomTheme({
      ...customTheme,
      [field]: value.replace('#', '')
    });
  };

  // Handle image upload for custom backgrounds
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target.result;
        setCustomTheme({
          ...customTheme,
          pattern: dataUrl
        });
        setSelectedPattern('Custom Image');
      };
      reader.readAsDataURL(file);
    }
  };

  // Apply desktop background
  const applyDesktopBackground = (backgroundValue) => {
    setCustomTheme({
      ...customTheme,
      pattern: backgroundValue
    });
    if (backgroundValue === 'none') {
      setSelectedPattern('None');
    } else if (backgroundValue.startsWith('/desktop/')) {
      const bg = DESKTOP_BACKGROUNDS.find(b => b.value === backgroundValue);
      setSelectedPattern(bg ? bg.name : 'Custom');
    }
  };

  // Mobile full-screen overlay
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: `#${theme.bgColor}` }}>
        {/* Mobile Header */}
        <div 
          className="flex items-center justify-between p-4 border-b"
          style={{
            backgroundColor: `#${theme.borderColor}`,
            borderColor: `#${theme.borderColor}`,
            color: '#FFFFFF'
          }}
        >
          <h2 className="text-lg font-bold">Personalization</h2>
          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-white hover:bg-opacity-20"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Mobile Content */}
        <div 
          className="flex-1 overflow-auto p-4 space-y-6"
          style={{ color: `#${theme.textColor}` }}
        >
          {/* Color Schemes */}
          <div className="space-y-4">
            <h3 className="font-semibold">Color Scheme</h3>
            <RadioGroup 
              value={selectedScheme} 
              onValueChange={setSelectedScheme}
              className="grid grid-cols-1 gap-3"
            >
              {COLOR_SCHEMES.map((scheme) => (
                <div key={scheme.name} className="flex items-center space-x-3">
                  <RadioGroupItem value={scheme.name} id={`scheme-${scheme.name}-mobile`} />
                  <Label htmlFor={`scheme-${scheme.name}-mobile`} className="flex items-center space-x-3 flex-1">
                    <div 
                      className="w-8 h-8 border-2 rounded"
                      style={{ backgroundColor: `#${scheme.bgColor}`, borderColor: `#${scheme.borderColor}` }}
                    />
                    <span className="text-base">{scheme.name}</span>
                  </Label>
                </div>
              ))}
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="Custom" id="scheme-custom-mobile" />
                <Label htmlFor="scheme-custom-mobile" className="text-base">Custom</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Custom Colors */}
          <div className="space-y-4">
            <h3 className="font-semibold">Custom Colors</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bgColor-mobile">Background Color</Label>
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-8 h-8 border"
                    style={{ backgroundColor: `#${customTheme.bgColor}` }}
                  />
                  <Input
                    id="bgColor-mobile"
                    value={`#${customTheme.bgColor}`}
                    onChange={(e) => handleColorChange('bgColor', e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="borderColor-mobile">Border Color</Label>
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-8 h-8 border"
                    style={{ backgroundColor: `#${customTheme.borderColor}` }}
                  />
                  <Input
                    id="borderColor-mobile"
                    value={`#${customTheme.borderColor}`}
                    onChange={(e) => handleColorChange('borderColor', e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="textColor-mobile">Text Color</Label>
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-8 h-8 border"
                    style={{ backgroundColor: `#${customTheme.textColor}` }}
                  />
                  <Input
                    id="textColor-mobile"
                    value={`#${customTheme.textColor}`}
                    onChange={(e) => handleColorChange('textColor', e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="buttonBgColor-mobile">Button Color</Label>
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-8 h-8 border"
                    style={{ backgroundColor: `#${customTheme.buttonBgColor}` }}
                  />
                  <Input
                    id="buttonBgColor-mobile"
                    value={`#${customTheme.buttonBgColor}`}
                    onChange={(e) => handleColorChange('buttonBgColor', e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Backgrounds */}
          <div className="space-y-4">
            <h3 className="font-semibold">Desktop Backgrounds</h3>
            <div className="grid grid-cols-2 gap-3">
              {DESKTOP_BACKGROUNDS.map((background) => (
                <button
                  key={background.value}
                  className={`p-2 rounded border-2 transition-all ${
                    customTheme.pattern === background.value ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => applyDesktopBackground(background.value)}
                >
                  {background.value === 'none' ? (
                    <div className="aspect-video bg-gray-100 rounded flex items-center justify-center text-xs">
                      No Background
                    </div>
                  ) : (
                    <div className="aspect-video overflow-hidden rounded">
                      <img 
                        src={background.value} 
                        alt={background.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="text-xs text-center mt-1">{background.name}</div>
                </button>
              ))}
            </div>
            
            {/* Upload Custom Image */}
            <div className="space-y-2">
              <h4 className="font-medium">Upload Custom Image</h4>
              <label
                className="block w-full px-4 py-3 text-center border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                style={{
                  borderColor: `#${theme.borderColor}`,
                  color: `#${theme.textColor}`
                }}
              >
                <Upload className="w-6 h-6 mx-auto mb-2" />
                <span className="text-sm">Choose Image</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
              {customTheme.pattern && customTheme.pattern.startsWith('data:image/') && (
                <div className="space-y-2">
                  <div className="text-xs text-gray-500">Current custom image:</div>
                  <div className="aspect-video overflow-hidden rounded border">
                    <img 
                      src={customTheme.pattern} 
                      alt="Custom background"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Patterns */}
          <div className="space-y-4">
            <h3 className="font-semibold">Background Pattern</h3>
            <RadioGroup 
              value={selectedPattern} 
              onValueChange={setSelectedPattern}
              className="grid grid-cols-1 gap-2"
            >
              {PATTERNS.map((pattern) => (
                <div key={pattern.name} className="flex items-center space-x-2">
                  <RadioGroupItem value={pattern.name} id={`pattern-${pattern.name}-mobile`} />
                  <Label htmlFor={`pattern-${pattern.name}-mobile`}>{pattern.name}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <h3 className="font-semibold">Preview</h3>
            <div
              className="border-2 rounded p-4 h-32 flex items-center justify-center relative overflow-hidden"
              style={{
                backgroundColor: `#${customTheme.bgColor}`,
                borderColor: `#${customTheme.borderColor}`,
                color: `#${customTheme.textColor}`,
                // Handle different background types
                backgroundImage: (() => {
                  if (customTheme.pattern === 'none') return undefined;
                  if (customTheme.pattern.startsWith('data:image/') || customTheme.pattern.startsWith('/desktop/')) {
                    return `url(${customTheme.pattern})`;
                  }
                  return customTheme.pattern; // CSS patterns
                })(),
                backgroundSize: customTheme.pattern.startsWith('data:image/') || customTheme.pattern.startsWith('/desktop/') ? 'cover' : '20px 20px',
                backgroundPosition: 'center',
                backgroundRepeat: customTheme.pattern.startsWith('data:image/') || customTheme.pattern.startsWith('/desktop/') ? 'no-repeat' : 'repeat'
              }}
            >
              {/* Overlay for better text readability when using background images */}
              {(customTheme.pattern.startsWith('data:image/') || customTheme.pattern.startsWith('/desktop/')) && customTheme.pattern !== 'none' && (
                <div 
                  className="absolute inset-0"
                  style={{
                    backgroundColor: `#${customTheme.bgColor}`,
                    opacity: 0.7
                  }}
                />
              )}
              <div 
                className="absolute top-0 left-0 right-0 h-8 flex items-center px-2 rounded-t z-20"
                style={{ backgroundColor: `#${customTheme.borderColor}`, color: '#FFFFFF' }}
              >
                <span className="text-xs">Preview Window</span>
              </div>
              <div className="mt-6 relative z-10">
                <span>Sample Text</span>
                <WindowButton 
                  className="ml-2" 
                  variant="primary"
                >
                  Button
                </WindowButton>
              </div>
            </div>
          </div>
        </div>
        
        {/* Mobile Apply Button */}
        <div 
          className="p-4 border-t"
          style={{ borderColor: `#${theme.borderColor}` }}
        >
          <WindowButton 
            onClick={handleApply}
            variant="primary"
            className="w-full flex items-center justify-center space-x-2 py-3"
          >
            <Check className="w-5 h-5" />
            <span>Apply Changes</span>
          </WindowButton>
        </div>
      </div>
    );
  }

  // Desktop view
  return (
    <WindowContainer
      title="Personalize Your Desktop"
      hasCloseButton={true}
      onClose={onClose}
    >
      <div className="space-y-6 max-h-[500px] overflow-y-auto">
      
      {/* Color Schemes */}
      <div className="space-y-4">
        <h3 className="font-semibold">Color Scheme</h3>
        <RadioGroup 
          value={selectedScheme} 
          onValueChange={setSelectedScheme}
          className="grid grid-cols-2 gap-2"
        >
          {COLOR_SCHEMES.map((scheme) => (
            <div key={scheme.name} className="flex items-center space-x-2">
              <RadioGroupItem value={scheme.name} id={`scheme-${scheme.name}`} />
              <Label htmlFor={`scheme-${scheme.name}`} className="flex items-center space-x-2">
                <div 
                  className="w-4 h-4 border"
                  style={{ backgroundColor: `#${scheme.bgColor}`, borderColor: `#${scheme.borderColor}` }}
                />
                <span>{scheme.name}</span>
              </Label>
            </div>
          ))}
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Custom" id="scheme-custom" />
            <Label htmlFor="scheme-custom">Custom</Label>
          </div>
        </RadioGroup>
      </div>
      
      {/* Custom Colors */}
      <div className="space-y-4">
        <h3 className="font-semibold">Custom Colors</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bgColor">Background Color</Label>
            <div className="flex items-center space-x-2">
              <div 
                className="w-6 h-6 border"
                style={{ backgroundColor: `#${customTheme.bgColor}` }}
              />
              <Input
                id="bgColor"
                value={`#${customTheme.bgColor}`}
                onChange={(e) => handleColorChange('bgColor', e.target.value)}
                className="w-24"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="borderColor">Border Color</Label>
            <div className="flex items-center space-x-2">
              <div 
                className="w-6 h-6 border"
                style={{ backgroundColor: `#${customTheme.borderColor}` }}
              />
              <Input
                id="borderColor"
                value={`#${customTheme.borderColor}`}
                onChange={(e) => handleColorChange('borderColor', e.target.value)}
                className="w-24"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="textColor">Text Color</Label>
            <div className="flex items-center space-x-2">
              <div 
                className="w-6 h-6 border"
                style={{ backgroundColor: `#${customTheme.textColor}` }}
              />
              <Input
                id="textColor"
                value={`#${customTheme.textColor}`}
                onChange={(e) => handleColorChange('textColor', e.target.value)}
                className="w-24"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="buttonBgColor">Button Color</Label>
            <div className="flex items-center space-x-2">
              <div 
                className="w-6 h-6 border"
                style={{ backgroundColor: `#${customTheme.buttonBgColor}` }}
              />
              <Input
                id="buttonBgColor"
                value={`#${customTheme.buttonBgColor}`}
                onChange={(e) => handleColorChange('buttonBgColor', e.target.value)}
                className="w-24"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Desktop Backgrounds */}
      <div className="space-y-4">
        <h3 className="font-semibold">Desktop Backgrounds</h3>
        <div className="grid grid-cols-3 gap-2">
          {DESKTOP_BACKGROUNDS.map((background) => (
            <button
              key={background.value}
              className={`p-1 rounded border transition-all ${
                customTheme.pattern === background.value ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-300 hover:border-gray-400'
              }`}
              onClick={() => applyDesktopBackground(background.value)}
            >
              {background.value === 'none' ? (
                <div className="aspect-video bg-gray-100 rounded flex items-center justify-center text-xs">
                  None
                </div>
              ) : (
                <div className="aspect-video overflow-hidden rounded">
                  <img 
                    src={background.value} 
                    alt={background.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="text-xs text-center mt-1">{background.name}</div>
            </button>
          ))}
        </div>
        
        {/* Upload Custom Image */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Upload Custom Image</h4>
          <label
            className="block w-full px-3 py-2 text-sm text-center border-2 border-dashed rounded cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <Upload className="w-4 h-4 mx-auto mb-1" />
            <span>Choose Image</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </label>
          {customTheme.pattern && customTheme.pattern.startsWith('data:image/') && (
            <div className="space-y-2">
              <div className="text-xs text-gray-500">Current custom image:</div>
              <div className="aspect-video overflow-hidden rounded border">
                <img 
                  src={customTheme.pattern} 
                  alt="Custom background"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Patterns */}
      <div className="space-y-4">
        <h3 className="font-semibold">Background Pattern</h3>
        <RadioGroup 
          value={selectedPattern} 
          onValueChange={setSelectedPattern}
          className="grid grid-cols-2 gap-2"
        >
          {PATTERNS.map((pattern) => (
            <div key={pattern.name} className="flex items-center space-x-2">
              <RadioGroupItem value={pattern.name} id={`pattern-${pattern.name}`} />
              <Label htmlFor={`pattern-${pattern.name}`}>{pattern.name}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>
      
      {/* Preview */}
      <div className="space-y-2">
        <h3 className="font-semibold">Preview</h3>
        <div
          className="border-2 rounded p-4 h-24 flex items-center justify-center relative overflow-hidden"
          style={{
            backgroundColor: `#${customTheme.bgColor}`,
            borderColor: `#${customTheme.borderColor}`,
            color: `#${customTheme.textColor}`,
            // Handle different background types
            backgroundImage: (() => {
              if (customTheme.pattern === 'none') return undefined;
              if (customTheme.pattern.startsWith('data:image/') || customTheme.pattern.startsWith('/desktop/')) {
                return `url(${customTheme.pattern})`;
              }
              return customTheme.pattern; // CSS patterns
            })(),
            backgroundSize: customTheme.pattern.startsWith('data:image/') || customTheme.pattern.startsWith('/desktop/') ? 'cover' : '20px 20px',
            backgroundPosition: 'center',
            backgroundRepeat: customTheme.pattern.startsWith('data:image/') || customTheme.pattern.startsWith('/desktop/') ? 'no-repeat' : 'repeat'
          }}
        >
          {/* Overlay for better text readability when using background images */}
          {(customTheme.pattern.startsWith('data:image/') || customTheme.pattern.startsWith('/desktop/')) && customTheme.pattern !== 'none' && (
            <div 
              className="absolute inset-0"
              style={{
                backgroundColor: `#${customTheme.bgColor}`,
                opacity: 0.7
              }}
            />
          )}
          <div 
            className="absolute top-0 left-0 right-0 h-6 flex items-center px-2 z-20"
            style={{ backgroundColor: `#${customTheme.borderColor}`, color: '#FFFFFF' }}
          >
            <span className="text-xs">Preview Window</span>
          </div>
          <div className="mt-4 relative z-10">
            <span>Sample Text</span>
            <WindowButton 
              className="ml-2" 
              variant="primary"
            >
              Button
            </WindowButton>
          </div>
        </div>
      </div>
      
        {/* Actions */}
        <div className="flex justify-end space-x-2 pt-4 border-t" style={{ borderColor: `#${theme.borderColor}40` }}>
          <WindowButton 
            onClick={handleApply}
            variant="primary"
            className="flex items-center space-x-1"
          >
            <Check className="w-4 h-4" />
            <span>Apply</span>
          </WindowButton>
        </div>
      </div>
    </WindowContainer>
  );
}
