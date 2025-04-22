'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/components/layouts/ThemeProvider';
import { supabase } from '@/lib/supabase/client';
import Window from '@/components/windows/Window';
import { 
  User, ShoppingBag, LogIn, ExternalLink, ArrowRight, 
  Package, Star, Heart, MessageSquare, Image, Globe
} from 'lucide-react';

/**
 * LandingPage - Windows-styled landing page component
 * Designed to look like a classic Windows setup wizard
 */
const LandingPage = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeWindows, setActiveWindows] = useState([]);
  const router = useRouter();
  const { theme } = useTheme();
  
  // Mock data for featured items
  const featuredItems = [
    {
      id: 1,
      title: 'Limited Edition Gundam Model Kit',
      image: '/api/placeholder/600/400?text=Gundam+Model',
      price: '¥12,800',
      likes: 42
    },
    {
      id: 2,
      title: 'Vintage Pokémon Cards Collection',
      image: '/api/placeholder/600/400?text=Pokemon+Cards',
      price: '¥15,600',
      likes: 87
    },
    {
      id: 3,
      title: 'Rare Japanese Snack Box',
      image: '/api/placeholder/600/400?text=Snack+Box',
      price: '¥3,200',
      likes: 24
    }
  ];
  
  // Steps for the setup wizard
  const steps = [
    { title: 'Welcome to JapanShopper' },
    { title: 'How It Works' },
    { title: 'Featured Items' },
    { title: 'Get Started' }
  ];
  
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
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  };
  
  const textColor = getContrastText(`#${bgColor}`);
  
  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        
        if (data.user) {
          // User is logged in, redirect to dashboard
          router.push('/dashboard');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Auth error:', error);
        setLoading(false);
      }
    };
    
    checkSession();
  }, [router]);
  
  // Show/hide demo windows
  useEffect(() => {
    if (currentStep === 2 && !activeWindows.includes('featuredItems')) {
      // Add featured items window when reaching that step
      setActiveWindows([...activeWindows, 'featuredItems']);
    }
  }, [currentStep, activeWindows]);
  
  // Handle window close
  const handleCloseWindow = (windowId) => {
    setActiveWindows(activeWindows.filter(id => id !== windowId));
  };
  
  // Go to next step
  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Last step - redirect to login/signup
      router.push('/login');
    }
  };
  
  // Go to previous step
  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // Is this the first step?
  const isFirstStep = currentStep === 0;
  
  // Is this the last step?
  const isLastStep = currentStep === steps.length - 1;
  
  // Skip to login/register
  const handleSkip = () => {
    router.push('/login');
  };
  
  // Render setup wizard content based on current step
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="flex justify-center mb-6">
              <div className="w-32 h-32 rounded-full flex items-center justify-center"
                style={{ 
                  background: `linear-gradient(135deg, #${borderColor}, #${bgColor})`,
                }}
              >
                <span className="text-4xl font-bold"
                  style={{ 
                    background: `linear-gradient(45deg, #${borderColor}, white)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
                  }}
                >JS</span>
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-center">Welcome to JapanShopper</h1>
            
            <p className="text-center mb-6">
              Your personal marketplace for buying and selling unique Japanese items.
              Connect with others who share your interests and discover treasures from Japan.
            </p>
            
            <div className="flex justify-center space-x-4">
              <div className="text-center">
                <div 
                  className="w-16 h-16 rounded-md mx-auto flex items-center justify-center mb-2"
                  style={{ backgroundColor: `#${borderColor}30` }}
                >
                  <ShoppingBag size={24} style={{ color: `#${borderColor}` }} />
                </div>
                <p className="text-sm">Buy Unique Items</p>
              </div>
              
              <div className="text-center">
                <div 
                  className="w-16 h-16 rounded-md mx-auto flex items-center justify-center mb-2"
                  style={{ backgroundColor: `#${borderColor}30` }}
                >
                  <Package size={24} style={{ color: `#${borderColor}` }} />
                </div>
                <p className="text-sm">Sell Your Items</p>
              </div>
              
              <div className="text-center">
                <div 
                  className="w-16 h-16 rounded-md mx-auto flex items-center justify-center mb-2"
                  style={{ backgroundColor: `#${borderColor}30` }}
                >
                  <Globe size={24} style={{ color: `#${borderColor}` }} />
                </div>
                <p className="text-sm">Connect Globally</p>
              </div>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-center mb-6">How JapanShopper Works</h2>
            
            <div className="space-y-6">
              <div className="flex items-start">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0"
                  style={{ backgroundColor: `#${borderColor}` }}
                >
                  <span style={{ color: getContrastText(borderColor) === '000000' ? '#000000' : '#FFFFFF' }}>1</span>
                </div>
                <div>
                  <h3 className="text-base font-medium">Create an Account</h3>
                  <p className="text-sm">Sign up for free and create your profile. Every user can both buy and sell items.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0"
                  style={{ backgroundColor: `#${borderColor}` }}
                >
                  <span style={{ color: getContrastText(borderColor) === '000000' ? '#000000' : '#FFFFFF' }}>2</span>
                </div>
                <div>
                  <h3 className="text-base font-medium">Browse or List Items</h3>
                  <p className="text-sm">Find items you're interested in, or list your own items for sale. You can also make specific requests.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0"
                  style={{ backgroundColor: `#${borderColor}` }}
                >
                  <span style={{ color: getContrastText(borderColor) === '000000' ? '#000000' : '#FFFFFF' }}>3</span>
                </div>
                <div>
                  <h3 className="text-base font-medium">Connect and Transact</h3>
                  <p className="text-sm">Message sellers, make offers, and complete secure transactions through our platform.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0"
                  style={{ backgroundColor: `#${borderColor}` }}
                >
                  <span style={{ color: getContrastText(borderColor) === '000000' ? '#000000' : '#FFFFFF' }}>4</span>
                </div>
                <div>
                  <h3 className="text-base font-medium">Ship and Receive</h3>
                  <p className="text-sm">Sellers ship items securely, and buyers confirm receipt. Rate your experience to help others.</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-center mb-4">Featured Items</h2>
            
            <p className="text-center mb-4">
              Explore popular items currently available on JapanShopper.
              Click on any item to learn more.
            </p>
            
            <div className="grid grid-cols-3 gap-3">
              {featuredItems.map((item) => (
                <div 
                  key={item.id}
                  className="border rounded-sm overflow-hidden"
                  style={{ borderColor: `#${borderColor}40` }}
                >
                  <div className="h-24 bg-gray-200 relative">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div 
                      className="absolute bottom-1 right-1 text-xs px-1.5 py-0.5 rounded-sm flex items-center"
                      style={{ 
                        backgroundColor: `rgba(${parseInt(borderColor.substr(0, 2), 16)}, ${parseInt(borderColor.substr(2, 2), 16)}, ${parseInt(borderColor.substr(4, 2), 16)}, 0.8)`,
                        color: getContrastText(borderColor) === '000000' ? '#000000' : '#FFFFFF'
                      }}
                    >
                      <Heart className="w-3 h-3 mr-1" />
                      {item.likes}
                    </div>
                  </div>
                  <div className="p-2">
                    <h3 className="text-xs font-medium truncate">{item.title}</h3>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs">{item.price}</span>
                      <button
                        className="text-xs px-1.5 py-0.5 rounded-sm"
                        style={{ 
                          backgroundColor: `#${borderColor}30`,
                          color: `#${borderColor}`
                        }}
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <p className="text-center text-sm mt-4">
              Thousands more items are waiting for you inside. Create an account to view all available items.
            </p>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-center mb-6">Get Started Now</h2>
            
            <div className="flex justify-center space-x-6 mb-8">
              <div 
                className="text-center p-4 border rounded-sm hover:shadow-md transition-shadow"
                style={{ borderColor: `#${borderColor}40` }}
              >
                <div 
                  className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-3"
                  style={{ backgroundColor: `#${borderColor}` }}
                >
                  <User className="w-8 h-8" style={{ color: getContrastText(borderColor) === '000000' ? '#000000' : '#FFFFFF' }} />
                </div>
                <h3 className="font-medium mb-2">Create Account</h3>
                <p className="text-sm mb-4">Sign up for a new account to buy and sell items.</p>
                <Link
                  href="/register"
                  className="inline-flex items-center px-4 py-2 text-sm rounded-sm"
                  style={{ 
                    backgroundColor: `#${borderColor}`,
                    color: getContrastText(borderColor) === '000000' ? '#000000' : '#FFFFFF',
                    border: `1px solid #${borderColor}`,
                    boxShadow: '1px 1px 0 rgba(0,0,0,0.1)'
                  }}
                >
                  Sign Up
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
              
              <div 
                className="text-center p-4 border rounded-sm hover:shadow-md transition-shadow"
                style={{ borderColor: `#${borderColor}40` }}
              >
                <div 
                  className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-3"
                  style={{ backgroundColor: `#${bgColor}40` }}
                >
                  <LogIn className="w-8 h-8" style={{ color: `#${borderColor}` }} />
                </div>
                <h3 className="font-medium mb-2">Sign In</h3>
                <p className="text-sm mb-4">Already have an account? Sign in to continue.</p>
                <Link
                  href="/login"
                  className="inline-flex items-center px-4 py-2 text-sm rounded-sm"
                  style={{ 
                    backgroundColor: 'transparent',
                    color: `#${borderColor}`,
                    border: `1px solid #${borderColor}`,
                  }}
                >
                  Sign In
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>
            
            <div className="text-center text-sm">
              <p>By signing up, you agree to our <Link href="/terms" className="underline">Terms of Service</Link> and <Link href="/privacy" className="underline">Privacy Policy</Link>.</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };
  
  // If checking login status, show loading
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div 
          className="w-10 h-10 rounded-full animate-spin"
          style={{ 
            borderWidth: '3px',
            borderStyle: 'solid',
            borderColor: `transparent #${borderColor} #${borderColor} #${borderColor}`
          }}
        ></div>
      </div>
    );
  }
  
  return (
    <div className="h-full relative">
      {/* Main Setup Wizard Window */}
      <Window
        id="setup-wizard"
        title={`JapanShopper Setup - ${steps[currentStep].title}`}
        position={{ x: (window.innerWidth - 600) / 2, y: (window.innerHeight - 500) / 2 }}
        size={{ width: 600, height: 500 }}
        isActive={true}
        theme={theme}
        onClose={handleSkip}
      >
        <div className="h-full flex flex-col">
          {/* Content Area */}
          <div className="flex-1 p-6 overflow-auto">
            {renderStepContent()}
          </div>
          
          {/* Navigation Buttons */}
          <div 
            className="p-4 border-t flex justify-between"
            style={{ borderColor: `#${borderColor}30` }}
          >
            <button
              className="px-4 py-1.5 text-sm rounded-sm"
              style={{ 
                backgroundColor: '#E5E7EB',
                color: '#374151',
                border: '1px solid #D1D5DB',
                boxShadow: '1px 1px 0 rgba(0,0,0,0.05)',
                visibility: isFirstStep ? 'hidden' : 'visible'
              }}
              onClick={handlePrevStep}
              disabled={isFirstStep}
            >
              &lt; Back
            </button>
            
            <div>
              <button
                className="px-4 py-1.5 text-sm rounded-sm mr-2"
                style={{ 
                  backgroundColor: 'transparent',
                  color: `#${borderColor}`,
                  border: `1px solid #${borderColor}`,
                }}
                onClick={handleSkip}
              >
                Skip
              </button>
              
              <button
                className="px-4 py-1.5 text-sm rounded-sm"
                style={{ 
                  backgroundColor: `#${borderColor}`,
                  color: getContrastText(borderColor) === '000000' ? '#000000' : '#FFFFFF',
                  border: `1px solid #${borderColor}`,
                  boxShadow: '1px 1px 0 rgba(0,0,0,0.1)'
                }}
                onClick={handleNextStep}
              >
                {isLastStep ? 'Finish' : 'Next >'}
              </button>
            </div>
          </div>
        </div>
      </Window>
      
      {/* Featured Items Window (showed during Step 3) */}
      {activeWindows.includes('featuredItems') && (
        <Window
          id="featured-items"
          title="Popular Items on JapanShopper"
          position={{ x: (window.innerWidth - 500) / 2 + 200, y: (window.innerHeight - 400) / 2 - 100 }}
          size={{ width: 500, height: 400 }}
          isActive={false}
          theme={theme}
          onClose={() => handleCloseWindow('featuredItems')}
        >
          <div className="h-full flex flex-col">
            <div className="flex-1 p-4 overflow-auto">
              <div className="grid grid-cols-2 gap-4">
                {[...featuredItems, ...featuredItems].map((item, i) => (
                  <div 
                    key={`${item.id}-${i}`}
                    className="border rounded-sm overflow-hidden"
                    style={{ borderColor: `#${borderColor}40` }}
                  >
                    <div className="h-32 bg-gray-200 relative">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                      <div 
                        className="absolute top-1 right-1 text-xs px-1.5 py-0.5 rounded-full flex items-center"
                        style={{ 
                          backgroundColor: `rgba(255,255,255,0.9)`,
                          color: `#${borderColor}`
                        }}
                      >
                        <Heart className="w-3 h-3 mr-1" />
                        {item.likes}
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm font-medium">{item.title}</h3>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm font-bold">{item.price}</span>
                        <div className="flex items-center">
                          <Star className="w-3 h-3 text-yellow-500" />
                          <Star className="w-3 h-3 text-yellow-500" />
                          <Star className="w-3 h-3 text-yellow-500" />
                          <Star className="w-3 h-3 text-yellow-500" />
                          <Star className="w-3 h-3 text-yellow-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div 
              className="p-2 border-t flex justify-between items-center text-xs"
              style={{ borderColor: `#${borderColor}30` }}
            >
              <span>{featuredItems.length * 2} items shown</span>
              <a 
                href="#" 
                className="flex items-center text-xs"
                style={{ color: `#${borderColor}` }}
              >
                View More <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </div>
          </div>
        </Window>
      )}
      
      {/* Chat/Messages Window */}
      {activeWindows.includes('messages') && (
        <Window
          id="messages"
          title="Messages"
          position={{ x: (window.innerWidth - 350) / 2 - 200, y: (window.innerHeight - 400) / 2 + 50 }}
          size={{ width: 350, height: 400 }}
          isActive={false}
          theme={theme}
          onClose={() => handleCloseWindow('messages')}
        >
          <div className="h-full flex flex-col">
            <div 
              className="py-2 px-3 text-center text-sm"
              style={{ backgroundColor: `#${bgColor}30` }}
            >
              <p>Connect with sellers and buyers</p>
            </div>
            <div className="flex-1 p-4 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare 
                  className="w-16 h-16 mx-auto mb-3 opacity-20"
                  style={{ color: `#${borderColor}` }}
                />
                <p className="text-sm">Sign in to view your messages</p>
                <Link
                  href="/login"
                  className="inline-flex items-center px-3 py-1 text-xs rounded-sm mt-3"
                  style={{ 
                    backgroundColor: `#${borderColor}`,
                    color: getContrastText(borderColor) === '000000' ? '#000000' : '#FFFFFF',
                  }}
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </Window>
      )}
    </div>
  );
};

export default LandingPage;