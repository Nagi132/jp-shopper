import React, { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { WindowButton } from '@/components/ui/window-button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { WindowContainer } from '@/components/ui/window-container';
import { useTheme } from '@/components/layouts/ThemeProvider';

// Predefined color schemes
const COLOR_SCHEMES = [
  { name: 'Classic', bgColor: 'D4D0C8', borderColor: '0A246A', textColor: '000000', buttonBgColor: 'D4D0C8' },
  { name: 'Blue', bgColor: 'ECE9D8', borderColor: '0A246A', textColor: '000000', buttonBgColor: 'B5D3EF' },
  { name: 'Rose', bgColor: 'ECE9D8', borderColor: 'AA0000', textColor: '000000', buttonBgColor: 'F5BFCC' },
  { name: 'Olive', bgColor: 'ECE9D8', borderColor: '6D7355', textColor: '000000', buttonBgColor: 'C6CFAA' },
  { name: 'Silver', bgColor: 'E3E3E3', borderColor: '424242', textColor: '000000', buttonBgColor: 'D9D9D9' },
  { name: 'Night', bgColor: '212121', borderColor: '4B6EAF', textColor: 'FFFFFF', buttonBgColor: '3B3B3B' },
];

// Available patterns
const PATTERNS = [
  { name: 'None', value: 'none' },
  { name: 'Grid', value: 'linear-gradient(#00000010 1px, transparent 1px), linear-gradient(90deg, #00000010 1px, transparent 1px)' },
  { name: 'Dots', value: 'radial-gradient(#00000015 1px, transparent 1px)' },
  { name: 'Lines', value: 'repeating-linear-gradient(45deg, #00000008, #00000008 1px, transparent 1px, transparent 10px)' },
];

export default function PersonalizationDialog({ onClose }) {
  const { theme, setTheme } = useTheme();
  const [selectedScheme, setSelectedScheme] = useState('Custom');
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
          className="border-2 rounded p-4 h-24 flex items-center justify-center relative"
          style={{
            backgroundColor: `#${customTheme.bgColor}`,
            borderColor: `#${customTheme.borderColor}`,
            color: `#${customTheme.textColor}`,
            backgroundImage: customTheme.pattern !== 'none' ? customTheme.pattern : undefined,
            backgroundSize: '20px 20px'
          }}
        >
          <div 
            className="absolute top-0 left-0 right-0 h-6 flex items-center px-2"
            style={{ backgroundColor: `#${customTheme.borderColor}`, color: '#FFFFFF' }}
          >
            <span className="text-xs">Preview Window</span>
          </div>
          <div className="mt-4">
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
