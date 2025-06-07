'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WindowContainer, WindowSection } from '@/components/ui/window-container';
import { WindowButton } from '@/components/ui/window-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/components/layouts/ThemeProvider';
import { useMessageBoxUtils } from './MessageBoxProvider';
import { supabase } from '@/lib/supabase/client';
import { UserCircle, Shield, Save, AlertTriangle, Loader2, Eye, EyeOff, Lock, Key, Upload, X, Camera, MapPin, Globe, Tag, Check, Clock, Phone } from 'lucide-react';


// Helper function to process avatar URLs consistently
const getProfileImageUrl = (avatarUrl, username = 'User') => {
  // Always fallback to UI Avatars if no URL or if it's problematic
  const getFallbackUrl = () => `https://ui-avatars.com/api/?name=${encodeURIComponent(username?.charAt(0) || 'U')}&background=random`;
  
  if (!avatarUrl) {
    return getFallbackUrl();
  }
  
  // If it's already a full URL, return as-is
  if (avatarUrl.startsWith('http')) {
    return avatarUrl;
  }
  
  // If it's a storage path, construct the proper Supabase storage URL
  if (avatarUrl && typeof avatarUrl === 'string') {
    try {
      // Get the public URL for the storage path
      const { data } = supabase.storage.from('avatars').getPublicUrl(avatarUrl);
      if (data?.publicUrl) {
        return data.publicUrl;
      }
    } catch (error) {
      // If storage URL construction fails, fall back to UI avatar
      console.warn('Failed to construct avatar URL:', error);
    }
  }
  
  // Fallback to UI avatar if all else fails
  return getFallbackUrl();
};


// Countries list with popular countries at the top
const COUNTRIES = [
  { value: "japan", label: "Japan 🇯🇵" },
  { value: "united-states", label: "United States 🇺🇸" },
  { value: "united-kingdom", label: "United Kingdom 🇬🇧" },
  { value: "canada", label: "Canada 🇨🇦" },
  { value: "australia", label: "Australia 🇦🇺" },
  { value: "germany", label: "Germany 🇩🇪" },
  { value: "france", label: "France 🇫🇷" },
  { value: "south-korea", label: "South Korea 🇰🇷" },
  { value: "china", label: "China 🇨🇳" },
  { value: "singapore", label: "Singapore 🇸🇬" },
  { value: "---", label: "──────────", disabled: true },
  { value: "afghanistan", label: "Afghanistan" },
  { value: "albania", label: "Albania" },
  { value: "algeria", label: "Algeria" },
  { value: "argentina", label: "Argentina" },
  { value: "armenia", label: "Armenia" },
  { value: "austria", label: "Austria" },
  { value: "azerbaijan", label: "Azerbaijan" },
  { value: "bangladesh", label: "Bangladesh" },
  { value: "belgium", label: "Belgium" },
  { value: "brazil", label: "Brazil" },
  { value: "bulgaria", label: "Bulgaria" },
  { value: "chile", label: "Chile" },
  { value: "colombia", label: "Colombia" },
  { value: "croatia", label: "Croatia" },
  { value: "czech-republic", label: "Czech Republic" },
  { value: "denmark", label: "Denmark" },
  { value: "egypt", label: "Egypt" },
  { value: "estonia", label: "Estonia" },
  { value: "finland", label: "Finland" },
  { value: "greece", label: "Greece" },
  { value: "hungary", label: "Hungary" },
  { value: "iceland", label: "Iceland" },
  { value: "india", label: "India" },
  { value: "indonesia", label: "Indonesia" },
  { value: "ireland", label: "Ireland" },
  { value: "israel", label: "Israel" },
  { value: "italy", label: "Italy" },
  { value: "latvia", label: "Latvia" },
  { value: "lithuania", label: "Lithuania" },
  { value: "luxembourg", label: "Luxembourg" },
  { value: "malaysia", label: "Malaysia" },
  { value: "mexico", label: "Mexico" },
  { value: "netherlands", label: "Netherlands" },
  { value: "new-zealand", label: "New Zealand" },
  { value: "norway", label: "Norway" },
  { value: "philippines", label: "Philippines" },
  { value: "poland", label: "Poland" },
  { value: "portugal", label: "Portugal" },
  { value: "romania", label: "Romania" },
  { value: "russia", label: "Russia" },
  { value: "spain", label: "Spain" },
  { value: "sweden", label: "Sweden" },
  { value: "switzerland", label: "Switzerland" },
  { value: "taiwan", label: "Taiwan" },
  { value: "thailand", label: "Thailand" },
  { value: "turkey", label: "Turkey" },
  { value: "ukraine", label: "Ukraine" },
  { value: "vietnam", label: "Vietnam" }
];

// Popular languages for Japan shopping
const LANGUAGES = [
  { value: "japanese", label: "Japanese 🇯🇵" },
  { value: "english", label: "English 🇺🇸" },
  { value: "korean", label: "Korean 🇰🇷" },
  { value: "chinese-simplified", label: "Chinese (Simplified) 🇨🇳" },
  { value: "chinese-traditional", label: "Chinese (Traditional) 🇹🇼" },
  { value: "spanish", label: "Spanish 🇪🇸" },
  { value: "french", label: "French 🇫🇷" },
  { value: "german", label: "German 🇩🇪" },
  { value: "portuguese", label: "Portuguese 🇵🇹" },
  { value: "italian", label: "Italian 🇮🇹" },
  { value: "russian", label: "Russian 🇷🇺" },
  { value: "arabic", label: "Arabic 🇸🇦" },
  { value: "thai", label: "Thai 🇹🇝" },
  { value: "vietnamese", label: "Vietnamese 🇻🇳" }
];

// Timezone options for better UX
const TIMEZONES = [
  { value: "Asia/Tokyo", label: "Japan (JST)" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "Europe/London", label: "Greenwich Mean Time (GMT)" },
  { value: "Europe/Paris", label: "Central European Time (CET)" },
  { value: "Europe/Berlin", label: "Central European Time (CET)" },
  { value: "Australia/Sydney", label: "Australian Eastern Time (AET)" },
  { value: "Asia/Seoul", label: "Korea Standard Time (KST)" },
  { value: "Asia/Shanghai", label: "China Standard Time (CST)" },
  { value: "Asia/Singapore", label: "Singapore Standard Time (SGT)" },
  { value: "UTC", label: "Coordinated Universal Time (UTC)" }
];

// Country codes for phone numbers
const PHONE_COUNTRIES = [
  { code: "+81", country: "Japan", flag: "🇯🇵" },
  { code: "+1", country: "United States", flag: "🇺🇸" },
  { code: "+1", country: "Canada", flag: "🇨🇦" },
  { code: "+44", country: "United Kingdom", flag: "🇬🇧" },
  { code: "+49", country: "Germany", flag: "🇩🇪" },
  { code: "+33", country: "France", flag: "🇫🇷" },
  { code: "+82", country: "South Korea", flag: "🇰🇷" },
  { code: "+86", country: "China", flag: "🇨🇳" },
  { code: "+65", country: "Singapore", flag: "🇸🇬" },
  { code: "+61", country: "Australia", flag: "🇦🇺" }
];

// Interest tags for better organization
const INTEREST_CATEGORIES = {
  fashion: ["Clothing", "Shoes", "Accessories", "Vintage Fashion", "Streetwear", "Designer Brands"],
  culture: ["Anime", "Manga", "J-Pop", "Traditional Arts", "Cosplay", "Japanese Music"],
  lifestyle: ["Beauty Products", "Skincare", "Home Decor", "Kitchen Items", "Stationery"],
  hobbies: ["Gaming", "Collecting", "Photography", "Sports", "Outdoor Activities"],
  food: ["Japanese Snacks", "Tea", "Sake", "Cooking Supplies", "Regional Specialties"],
  tech: ["Electronics", "Gadgets", "Computer Hardware", "Cameras", "Mobile Accessories"]
};

// Default user data - defined outside component
const DEFAULT_USER_DATA = {
  username: '',
  email: '',
  password: '********',
  firstName: '',
  lastName: '',
  bio: '',
  country: '',
  interests: '',
  languages: '',
  timezone: '',
  phoneCountryCode: '+81',
  phoneNumber: '',
  avatarUrl: ''
};

// Demo user data - defined outside component
const DEMO_USER_DATA = {
  username: 'demo_user',
  email: 'demo@example.com',
  password: '********',
  firstName: 'Demo',
  lastName: 'User',
  bio: 'This is a demo account for testing the JP Shopper app.',
  country: 'japan',
  interests: 'Anime, Manga, Electronics, Fashion',
  languages: 'japanese,english',
  timezone: 'Asia/Tokyo',
  phoneCountryCode: '+81',
  phoneNumber: '90-1234-5678',
  avatarUrl: ''
};

const SettingsPage = ({ isWindowView = true }) => {
  const { theme } = useTheme();
  const messageBox = useMessageBoxUtils();
  
  // Prevent useEffect from running multiple times with these refs
  const isDataFetched = useRef(false);
  const isMounted = useRef(true);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState(DEFAULT_USER_DATA);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [activeInterestCategory, setActiveInterestCategory] = useState('fashion');

  // Password change state
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordFeedback, setPasswordFeedback] = useState('');

  // Email change state
  const [changingEmail, setChangingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  
  // Profile photo state
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  // Fetch user data from Supabase - runs only once
  useEffect(() => {
    // Set up mount state for cleanup
    isMounted.current = true;
    
    // Skip if data already fetched to prevent loops
    if (isDataFetched.current) return;
    
    isDataFetched.current = true;
    
    // Fallback timer to prevent infinite loading state
    const fallbackTimer = setTimeout(() => {
      if (isMounted.current) {
        setLoading(false);
        setUserData(DEMO_USER_DATA);
        messageBox.warning('Failed to load profile data. Using demo mode instead.');
      }
    }, 5000); // 5 second timeout
    
    const fetchUserData = async () => {
      try {
        if (!isMounted.current) return;
        
        // Try to get user, but don't throw on failure - use demo mode instead
        const { data, error: authError } = await supabase.auth.getUser();
        
        if (authError || !data.user) {
          if (isMounted.current) {
            // Using demo mode
            setUserData(DEMO_USER_DATA);
            clearTimeout(fallbackTimer);
            setLoading(false);
          }
          return;
        }
        
        const user = data.user;
        
        // Check if user is from an external provider
        let isExternalProvider = false;
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (!sessionError && session) {
          // Check if user has external identities
          isExternalProvider = user.app_metadata?.provider && 
                              user.app_metadata.provider !== 'email' && 
                              !user.identities.some(identity => identity.provider === 'email');
        }
        
        if (user && isMounted.current) {
          // Fetch profile data from profiles table
          try {
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', user.id)
              .single();
              
            // Check if component is still mounted
            if (!isMounted.current) return;
            
            if (error) {
              // Just show default data if profile can't be loaded
              setUserData({
                username: user.user_metadata?.username || user.email?.split('@')[0] || '',
                email: user.email || '',
                password: '********', // Password is always masked
                firstName: user.user_metadata?.first_name || '',
                lastName: user.user_metadata?.last_name || '',
                bio: '',
                country: '',
                interests: '',
                languages: '',
                timezone: '',
                phoneCountryCode: '+81',
                phoneNumber: '',
                avatarUrl: '',
                isExternalProvider: isExternalProvider, // Store provider info
                provider: user.app_metadata?.provider || 'email'
              });
            } else if (profile) {
              // Use standardized field names - with fallback for legacy data
              const firstName = profile.first_name || (profile.full_name ? profile.full_name.split(' ')[0] : '') || '';
              const lastName = profile.last_name || (profile.full_name ? profile.full_name.split(' ').slice(1).join(' ') : '') || '';
              
              // Process avatar URL using the helper function (updated)
              const avatarUrlValue = getProfileImageUrl(profile.avatar_url, profile.username);
              
              // Set the user data with standardized field mapping
              setUserData({
                username: profile.username || user.user_metadata?.username || user.email?.split('@')[0] || '',
                email: user.email || '',
                password: '********', // Password is always masked
                firstName: firstName,
                lastName: lastName,
                bio: profile.bio || '',
                country: profile.country || '',
                interests: profile.interests || '',
                languages: profile.languages || '',
                timezone: profile.timezone || 'Asia/Tokyo',
                phoneCountryCode: profile.phone_country_code || '+81',
                phoneNumber: profile.phone_number || '',
                avatarUrl: avatarUrlValue,
                isExternalProvider: isExternalProvider, // Store provider info
                provider: user.app_metadata?.provider || 'email'
              });
              
              // Set selected interests array from comma-separated string
              if (profile.interests && typeof profile.interests === 'string') {
                const interestsArray = profile.interests.split(',').map(s => s.trim()).filter(s => s);
                setSelectedInterests(interestsArray);
              } else if (Array.isArray(profile.interests)) {
                setSelectedInterests(profile.interests);
              }
              
              // Set selected languages array from comma-separated string
              if (profile.languages && typeof profile.languages === 'string') {
                const languagesArray = profile.languages.split(',').map(s => s.trim()).filter(s => s);
                setSelectedLanguages(languagesArray);
              } else if (Array.isArray(profile.languages)) {
                setSelectedLanguages(profile.languages);
              }
              
              // Set photo preview after URL processing
              if (avatarUrlValue) {
                setPhotoPreview(avatarUrlValue);
              } else {
                setPhotoPreview('');
              }
            }
          } catch (profileError) {
            // Fallback to basic user data
              setUserData({
                username: user.user_metadata?.username || user.email?.split('@')[0] || '',
                email: user.email || '',
                password: '********',
                firstName: user.user_metadata?.first_name || '',
                lastName: user.user_metadata?.last_name || '',
                bio: '',
                country: '',
                interests: '',
                languages: '',
                timezone: '',
                phoneCountryCode: '+81',
                phoneNumber: '',
                avatarUrl: '',
                isExternalProvider: isExternalProvider,
                provider: user.app_metadata?.provider || 'email'
              });
            }
        }
        
        // Clear the fallback timer since we've completed loading
        clearTimeout(fallbackTimer);
        setLoading(false);
        
      } catch (error) {
        if (isMounted.current) {
          setUserData(DEMO_USER_DATA);
          clearTimeout(fallbackTimer);
          setLoading(false);
          messageBox.warning('Error loading user data. Using demo mode instead.');
        }
      }
    };

    // Start loading the user data
    fetchUserData();
    
    // Cleanup function to handle component unmounting
    return () => {
      isMounted.current = false;
      clearTimeout(fallbackTimer);
    };
  }, [messageBox]); 

  // Update user data with validation
  const updateUserData = (key, value) => {
    setUserData(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Clear error for this field when user starts typing
    if (formErrors[key]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };
  
  // Form validation
  const validateForm = () => {
    const errors = {};
    
    if (!userData.firstName.trim()) {
      errors.firstName = 'First name is required';
    } else if (userData.firstName.length < 2) {
      errors.firstName = 'First name must be at least 2 characters';
    }
    
    if (!userData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(userData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (userData.bio && userData.bio.length > 500) {
      errors.bio = 'Bio must be less than 500 characters';
    }
    
    // Validate phone number if provided
    if (userData.phoneNumber.trim()) {
      const phoneRegex = /^[\d\s\-\(\)\+]+$/;
      if (!phoneRegex.test(userData.phoneNumber)) {
        errors.phoneNumber = 'Please enter a valid phone number';
      } else if (userData.phoneNumber.replace(/[\D]/g, '').length < 7) {
        errors.phoneNumber = 'Phone number must have at least 7 digits';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle language selection
  const toggleLanguage = (languageValue) => {
    setSelectedLanguages(prev => {
      if (prev.includes(languageValue)) {
        return prev.filter(lang => lang !== languageValue);
      } else {
        return [...prev, languageValue];
      }
    });
  };
  
  // Handle interest selection
  const toggleInterest = (interest) => {
    setSelectedInterests(prev => {
      if (prev.includes(interest)) {
        return prev.filter(int => int !== interest);
      } else {
        return [...prev, interest];
      }
    });
  };
  
  // Clear all interests in category
  const clearInterestCategory = (category) => {
    const categoryInterests = INTEREST_CATEGORIES[category];
    setSelectedInterests(prev => 
      prev.filter(interest => !categoryInterests.includes(interest))
    );
  };

  // Calculate password strength
  const validatePasswordStrength = (password) => {
    // Start with a base score
    let score = 0;
    let feedback = '';

    // No password or very short
    if (!password || password.length < 6) {
      setPasswordFeedback('Password is too short (minimum 6 characters)');
      setPasswordStrength(0);
      return;
    }

    // Length check
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;

    // Check for required character types (Supabase requirements)
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_\-+\=\[\]{};\':\"\\|<>?,.\\/`~]/.test(password);

    // Add to score based on complexity
    if (hasLowercase) score += 1;
    if (hasUppercase) score += 1; 
    if (hasNumber) score += 1;
    if (hasSpecial) score += 1;

    // Check if it meets Supabase requirements
    const meetsRequirements = hasLowercase && hasUppercase && hasNumber && hasSpecial;

    // Generate feedback based on score and missing requirements
    let missingRequirements = [];
    if (!hasLowercase) missingRequirements.push("lowercase letter");
    if (!hasUppercase) missingRequirements.push("uppercase letter");
    if (!hasNumber) missingRequirements.push("number");
    if (!hasSpecial) missingRequirements.push("special character");

    if (!meetsRequirements) {
      feedback = `Missing: ${missingRequirements.join(", ")}`;
    if (score < 3) {
        feedback = "Weak: " + feedback;
      } else {
        feedback = "Medium: " + feedback;
      }
    } else if (score < 4) {
      feedback = 'Medium: Password meets requirements but could be stronger';
    } else {
      feedback = 'Strong: Excellent password!';
    }

    // Normalize score to 0-100, but cap at 70 if it doesn't meet Supabase requirements
    let normalizedScore = Math.min(Math.floor((score / 6) * 100), 100);
    if (!meetsRequirements) {
      normalizedScore = Math.min(normalizedScore, 70);
    }
    
    setPasswordStrength(normalizedScore);
    setPasswordFeedback(feedback);
  };

  // Immediate functions with direct button press handling
  const directPasswordChange = () => {
    if (changingPassword) {
      setChangingPassword(false);
    } else {
      setChangingPassword(true);
      
      // Force reset after 30 seconds no matter what
      window.setTimeout(() => {
        setChangingPassword(false);
      }, 30000); // 30 seconds
    }
  };
  
  const directEmailChange = () => {
    if (changingEmail) {
      setChangingEmail(false);
    } else {
      setChangingEmail(true);
      
      // Force reset after 30 seconds no matter what
      window.setTimeout(() => {
        setChangingEmail(false);
      }, 30000); // 30 seconds
    }
  };

  // Ultra-verbose debug version of password change with window.setTimeout
  const handlePasswordChange = async () => {
    try {
      // Show loading state in button
      setSaving(true); // Use the main saving state for the button
      
      // Basic validation
      if (!currentPassword) {
        messageBox.error('Current password is required');
        setSaving(false);
        return;
      }
      
      if (!newPassword || !confirmPassword) {
        messageBox.error('Please fill in all password fields');
        setSaving(false);
        return;
      }
      
      if (newPassword !== confirmPassword) {
        messageBox.error('New passwords do not match');
        setSaving(false);
        return;
      }
      
      // Check for Supabase password requirements
      const hasLowercase = /[a-z]/.test(newPassword);
      const hasUppercase = /[A-Z]/.test(newPassword);
      const hasNumber = /[0-9]/.test(newPassword);
      const hasSpecial = /[!@#$%^&*()_\-+\=\[\]{};\':\"\\|<>?,.\\/`~]/.test(newPassword);
      const meetsRequirements = hasLowercase && hasUppercase && hasNumber && hasSpecial;
      
      if (!meetsRequirements) {
        messageBox.error('Password must contain at least one: lowercase letter, uppercase letter, number, and special character');
        setSaving(false);
        return;
      }
      
      // Verify password first
      const verifyResult = await supabase.auth.signInWithPassword({
        email: userData.email,
        password: currentPassword
      });
      
      if (verifyResult.error) {
        messageBox.error('Current password is incorrect');
        setSaving(false);
        return;
      }
      
      const updateResult = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (updateResult.error) {
        messageBox.error(updateResult.error.message || 'Failed to update password');
        setSaving(false);
        return;
      }
      
      messageBox.success('Your password has been updated successfully!');
      
      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordStrength(0);
      setPasswordFeedback('');
      setChangingPassword(false);
      
    } catch (error) {
      console.error('Password change error:', error);
      messageBox.error('An unexpected error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  // Email change function
  const handleEmailChange = async () => {
    try {
      // Show loading state in button
      setSaving(true);
      
      // Basic validation
    if (!newEmail || !newEmail.includes('@')) {
        messageBox.error('Please enter a valid email address');
        setSaving(false);
      return;
    }
    
    if (!emailPassword) {
        messageBox.error('Password is required to change your email');
        setSaving(false);
        return;
      }
      
      // Verify password first
      const verifyResult = await supabase.auth.signInWithPassword({
        email: userData.email,
        password: emailPassword
      });
      
      if (verifyResult.error) {
        messageBox.error('Password is incorrect');
        setSaving(false);
        return;
      }
      
      const updateResult = await supabase.auth.updateUser({
        email: newEmail
      });
      
      if (updateResult.error) {
        messageBox.error(updateResult.error.message || 'Failed to update email');
        setSaving(false);
        return;
      }
      
      messageBox.info(
        'A confirmation email has been sent to your new address. Please check your inbox and click the verification link to complete the change.',
        'Verification Required'
      );
      
      setEmailPassword('');
      setChangingEmail(false);
      
    } catch (error) {
      console.error('Email change error:', error);
      messageBox.error('An unexpected error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Handle profile photo upload
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    processSelectedFile(file);
  };
  
  // Process selected file for upload
  const processSelectedFile = (file) => {
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      messageBox.error('Please select an image file (JPEG, PNG, etc.)');
      return;
    }
    
    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      messageBox.error('Image file must be under 2MB');
      return;
    }
    
    setPhotoFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };
  
  // Handle drag and drop events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };
  
  // Remove photo
  const removePhoto = () => {
    setPhotoPreview('');
    setPhotoFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Upload photo to Supabase
  const uploadPhotoToStorage = async (userId, file) => {
    if (!file) return null;
    
    try {
      setUploadingPhoto(true);
      
      // Create a unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = fileName; // Don't include 'avatars/' prefix - Supabase adds this automatically
      
      // Test bucket existence before attempting upload
      try {
        const { error: bucketError } = await supabase.storage
          .from('avatars')
          .list('', { limit: 1 });
          
        if (bucketError) {
          console.error('Cannot access avatars bucket:', bucketError);
          messageBox.error(`Cannot access the storage bucket: ${bucketError.message || 'Unknown error'}`);
          return null;
        }
      } catch (bucketCheckErr) {
        console.error('Exception checking bucket access:', bucketCheckErr);
      }
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
        
      if (uploadError) {
        console.error('Error uploading profile photo:', uploadError);
        console.error('File info:', {
          name: file.name,
          type: file.type,
          size: file.size,
          path: filePath
        });
        messageBox.error(`Failed to upload profile photo: ${uploadError.message || 'Unknown error'}`);
        return null;
      }
      
      // Get the public URL
      const { data: urlData, error: urlError } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
        
      if (urlError) {
        console.error('Error getting public URL:', urlError);
        messageBox.error('File uploaded but could not get public URL');
        return null;
      }
      
      const publicUrl = urlData?.publicUrl;
      console.log('Profile photo uploaded successfully');
      
      // Return both the storage path and public URL
      return {
        path: filePath, // Just the filename
        url: publicUrl
      };
      
    } catch (error) {
      console.error('Exception during photo upload:', error);
      messageBox.error('An unexpected error occurred during photo upload');
      return null;
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Handle save
  const handleSave = async () => {
    // Validate form first
    if (!validateForm()) {
      messageBox.error('Please fix the errors below before saving.');
      setSaving(false);
      return;
    }
    
    try {
      setSaving(true);
      
      // Try to get current user
      const { data, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Auth error during save:', authError);
        messageBox.error('Authentication error while saving. Using demo mode.');
        // Simulate saving for demo
        setTimeout(() => {
          messageBox.success('Profile updated successfully (Demo mode)', 'Settings Saved');
          setSaving(false);
        }, 1000);
        return;
      }
      
      const user = data?.user;
      if (!user) {
        // For demo, just simulate a successful save
        setTimeout(() => {
          messageBox.success('Profile updated successfully (Demo mode)', 'Settings Saved');
          setSaving(false);
        }, 1000);
        return;
      }
      
      // Handle photo upload if there's a new photo
      let photoData = null;
      if (photoFile) {
        photoData = await uploadPhotoToStorage(user.id, photoFile);
        if (!photoData) {
          // Photo upload failed but we can continue with other updates
          console.log('Photo upload failed, continuing with other updates');
        }
      }
      
      // Delete photo from storage if it was removed
      if (photoPreview === '' && userData.avatarUrl) {
        try {
          console.log('Deleting profile photo from storage');
          
          // Extract the filename from avatarUrl
          let fileName = userData.avatarUrl;
          if (fileName.includes('storage/v1/object/public/avatars/')) {
            // Extract filename from full URL
            fileName = fileName.split('storage/v1/object/public/avatars/')[1];
          } else if (fileName.startsWith('avatars/')) {
            // Remove avatars/ prefix to get just the filename
            fileName = fileName.substring(8);
          }
          // fileName should now be just the filename without any path prefix
          
          console.log('Attempting to delete file at path:', fileName);
          
          if (fileName) {
            const { error: deleteError } = await supabase.storage
              .from('avatars')
              .remove([fileName]);
              
            if (deleteError) {
              console.error('Error deleting profile photo:', deleteError);
              // Don't stop the save process for a photo deletion error
            } else {
              console.log('Profile photo deleted from storage');
            }
          }
        } catch (deleteErr) {
          console.error('Exception during photo deletion:', deleteErr);
          // Continue with save even if photo deletion fails
        }
      }
      
      // Update email if changed (authentication)
      if (userData.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: userData.email
        });
        
        if (emailError) {
          console.error('Email update error:', emailError);
          messageBox.error('Could not update email: ' + emailError.message);
          setSaving(false);
          return;
        }
      }
      
      // First, get the profile to determine the actual schema
      const { data: existingProfile, error: getError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (getError) {
        console.error('Error getting profile before save:', getError);
        messageBox.error('Could not get profile: ' + getError.message);
        setSaving(false);
        return;
      }
      
      // Update main profile data
      if (existingProfile) {
        // Use standardized field names for profile update
        const profileUpdate = {
          username: userData.username,
          first_name: userData.firstName,
          last_name: userData.lastName,
          full_name: `${userData.firstName} ${userData.lastName}`.trim(),
          bio: userData.bio,
          country: userData.country,
          interests: selectedInterests.length > 0 ? selectedInterests.join(', ') : '',
          // Handle languages - convert to string for TEXT column or array for TEXT[] column
          languages: selectedLanguages.length > 0 ? selectedLanguages.join(', ') : '',
          timezone: userData.timezone,
          phone_country_code: userData.phoneCountryCode,
          phone_number: userData.phoneNumber,
          updated_at: new Date().toISOString()
        };
        
        // Add photo data if available
        if (photoData) {
          profileUpdate.avatar_url = photoData.path; // Store just the filename
        } else if (photoPreview === '') {
          // User removed the photo
          profileUpdate.avatar_url = null;
        }
        
        // For existing profiles, use UPDATE instead of UPSERT to avoid conflicts
        
        // Update existing profile using standardized field names
        
        // Update profile in database - use UPDATE for existing profiles
        let profileError;
        try {
          const { error } = await supabase
          .from('profiles')
          .update(profileUpdate)
          .eq('user_id', user.id);
          
          profileError = error;
        } catch (err) {
          profileError = err;
        }
        
        if (profileError) {
          console.error('Profile update error:', profileError);
          
          // Handle missing column errors gracefully or type mismatch errors
          if (profileError.message && (profileError.message.includes('does not exist') || profileError.message.includes('is of type text[] but expression is of type text'))) {
            console.log('Schema mismatch detected, updating with only basic fields');
            console.log('Error details:', profileError);
            
            // Try with only basic fields that should exist
            const basicUpdate = {
              username: userData.username,
              full_name: `${userData.firstName} ${userData.lastName}`.trim(),
              bio: userData.bio || '',
              updated_at: new Date().toISOString()
            };
            
            // Add photo data if available
            if (photoData) {
              basicUpdate.avatar_url = photoData.path;
            } else if (photoPreview === '') {
              basicUpdate.avatar_url = null;
            }
            
            try {
              const { error: basicError } = await supabase
                .from('profiles')
                .update(basicUpdate)
                .eq('user_id', user.id);
                
              if (basicError) {
                console.error('Basic profile update failed:', basicError);
                messageBox.error('Could not update profile. Please run the database migration first.');
                setSaving(false);
                return;
              }
              
              // Store additional fields in localStorage as fallback
              localStorage.setItem('user_preferences', JSON.stringify({
                country: userData.country,
                interests: selectedInterests.join(', '),
                languages: selectedLanguages.join(', '),
                timezone: userData.timezone,
                phoneCountryCode: userData.phoneCountryCode,
                phoneNumber: userData.phoneNumber
              }));
              
              console.log('Basic profile saved, additional preferences stored locally');
              messageBox.warning('Profile saved with basic info. Run database migration for full functionality.');
              
            } catch (basicErr) {
              console.error('Exception during basic profile update:', basicErr);
              messageBox.error('Could not update profile: ' + basicErr.message);
              setSaving(false);
              return;
            }
          } else {
            messageBox.error('Could not update profile: ' + profileError.message);
            setSaving(false);
            return;
          }
        }
      } else {
        // No existing profile found, need to create a new one
        
        // Add basic field structure for new profile
        // These fields are the most commonly used in Supabase schemas
        const interestsString = selectedInterests.length > 0 ? selectedInterests.join(', ') : '';
        const languagesString = selectedLanguages.length > 0 ? selectedLanguages.join(', ') : '';
        
        const profileUpdate = {
          user_id: user.id,
          username: userData.username,
          full_name: `${userData.firstName} ${userData.lastName}`.trim(),
          bio: userData.bio,
          interests: interestsString,
          languages: languagesString,
          timezone: userData.timezone,
          phone_country_code: userData.phoneCountryCode,
          phone_number: userData.phoneNumber
        };
        
        // Add avatar if available
        if (photoData) {
          profileUpdate.avatar_url = photoData.path;
        }
        
        // For new profiles, use INSERT
        try {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert(profileUpdate);
        
        if (profileError) {
            console.error('Profile create error:', profileError);
          
          // If error mentions the field doesn't exist, try with a minimal profile
          if (profileError.message && profileError.message.includes('column') && profileError.message.includes('does not exist')) {
              console.log('Schema error creating profile, trying with minimal fields');
            
            // Try a minimal insert with just user_id
            const minimalProfile = { user_id: user.id };
            const { error: minimalError } = await supabase
              .from('profiles')
              .insert(minimalProfile);
              
            if (minimalError) {
                console.error('Even minimal profile creation failed:', minimalError);
              messageBox.error('Could not create profile: ' + minimalError.message);
              setSaving(false);
              return;
            }
          } else {
            messageBox.error('Could not create profile: ' + profileError.message);
            setSaving(false);
            return;
          }
        }
        } catch (insertErr) {
          console.error('Exception during profile insert:', insertErr);
          messageBox.error('Could not create profile: ' + insertErr.message);
          setSaving(false);
          return;
        }
      }
      
      // If we successfully saved everything, update the local state
      if (photoData) {
        setPhotoFile(null);
        
        // Update in-memory state with the full URL, not just the path
        setUserData(prev => ({
          ...prev,
          avatarUrl: photoData.url
        }));
        
        // Set the preview to the full public URL
        setPhotoPreview(photoData.url);
      }
      
      messageBox.success('Your profile has been updated successfully.', 'Settings Saved');
      setSaving(false);
    } catch (error) {
      console.error('Unexpected error during save:', error);
      messageBox.error('There was a problem saving your data: ' + (error.message || 'Please try again.'));
      setSaving(false);
    } finally {
      // Ensure saving is set to false in all cases
      setSaving(false);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div 
        className={`${isWindowView ? 'p-4' : 'p-6 bg-white rounded-lg shadow'} flex flex-col items-center justify-center h-full min-h-[300px]`}
        style={isWindowView ? { backgroundColor: `#${theme.bgColor}` } : {}}
      >
        <Loader2 className="w-8 h-8 animate-spin mb-4" style={{ color: `#${theme.borderColor}` }} />
        <p style={{ color: `#${theme.textColor}` }}>Loading your profile data...</p>
        <WindowButton 
          className="mt-4 text-sm"
          onClick={() => {
            setLoading(false);
            setUserData(DEMO_USER_DATA);
          }}
          variant="secondary"
          disabled={loading}
        >
          Skip Loading
        </WindowButton>
      </div>
    );
  }

  return (
    <WindowContainer>
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-6">
          {/* Profile Photo Section */}
          <WindowSection title="Profile Photo">
            <div className="flex items-start space-x-6">
              <div className="relative">
                <div 
                  className={`w-32 h-32 rounded-full overflow-hidden border-2 flex items-center justify-center bg-gray-100 ${dragActive ? 'ring-2 ring-blue-500' : ''}`}
                  style={{ borderColor: `#${theme.borderColor}` }}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  {photoPreview ? (
                    <img 
                      src={photoPreview} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to UI Avatars instead of clearing
                        const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.firstName?.charAt(0) || userData.username?.charAt(0) || 'U')}&background=random`;
                        e.target.src = fallbackUrl;
                        setPhotoPreview(fallbackUrl);
                      }}
                    />
                  ) : null}
                  <div className={`${photoPreview ? 'hidden' : 'flex'} w-full h-full items-center justify-center`}>
                    <UserCircle className="w-20 h-20 text-gray-400" />
                  </div>
                </div>
                
                {photoPreview && (
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full shadow-md"
                    title="Remove photo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div className="flex-1">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium mb-2" style={{ color: `#${theme.textColor}` }}>Upload New Photo</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Choose a photo that represents you well. JPG, PNG, or GIF. Max size 2MB.
                    </p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <WindowButton
                      variant="primary"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPhoto}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadingPhoto ? 'Uploading...' : 'Choose Photo'}
                    </WindowButton>
                    
                    {photoPreview && (
                      <WindowButton
                        variant="secondary"
                        size="sm"
                        onClick={removePhoto}
                      >
                        Remove
                      </WindowButton>
                    )}
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          </WindowSection>
          
          {/* Basic Information */}
          <WindowSection title="Basic Information">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="flex items-center gap-2" style={{ color: `#${theme.textColor}` }}>
                    <UserCircle className="w-4 h-4" />
                    First Name *
                  </Label>
                  <Input
                    id="firstName"
                    value={userData.firstName}
                    onChange={(e) => updateUserData('firstName', e.target.value)}
                    className={`transition-all duration-200 ${formErrors.firstName ? 'border-red-500 ring-2 ring-red-200' : 'focus:ring-2 focus:ring-blue-200'}`}
                    style={{
                      backgroundColor: `#${theme.bgColor}`,
                      color: `#${theme.textColor}`,
                      borderColor: formErrors.firstName ? '#ef4444' : `#${theme.borderColor}`
                    }}
                    placeholder="Enter your first name"
                  />
                  {formErrors.firstName && (
                    <div className="flex items-center gap-1 text-red-500">
                      <AlertTriangle className="w-3 h-3" />
                      <p className="text-xs">{formErrors.firstName}</p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="flex items-center gap-2" style={{ color: `#${theme.textColor}` }}>
                    <UserCircle className="w-4 h-4" />
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    value={userData.lastName}
                    onChange={(e) => updateUserData('lastName', e.target.value)}
                    className="transition-all duration-200 focus:ring-2 focus:ring-blue-200"
                    style={{
                      backgroundColor: `#${theme.bgColor}`,
                      color: `#${theme.textColor}`,
                      borderColor: `#${theme.borderColor}`
                    }}
                    placeholder="Enter your last name"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio" className="flex items-center gap-2" style={{ color: `#${theme.textColor}` }}>
                  <Tag className="w-4 h-4" />
                  About You
                </Label>
                <Textarea
                  id="bio"
                  value={userData.bio}
                  onChange={(e) => updateUserData('bio', e.target.value)}
                  placeholder="Tell others about yourself, your interests, and what you're looking for from Japan..."
                  className={`min-h-24 transition-all duration-200 resize-none ${formErrors.bio ? 'border-red-500 ring-2 ring-red-200' : 'focus:ring-2 focus:ring-blue-200'}`}
                  style={{
                    backgroundColor: `#${theme.bgColor}`,
                    color: `#${theme.textColor}`,
                    borderColor: formErrors.bio ? '#ef4444' : `#${theme.borderColor}`
                  }}
                />
                <div className="flex justify-between items-center mt-1">
                  {formErrors.bio && (
                    <div className="flex items-center gap-1 text-red-500">
                      <AlertTriangle className="w-3 h-3" />
                      <p className="text-xs">{formErrors.bio}</p>
                    </div>
                  )}
                  <p className="text-xs opacity-60 ml-auto" style={{ color: `#${theme.textColor}` }}>
                    {userData.bio?.length || 0}/500 characters
                  </p>
                </div>
              </div>
            </div>
          </WindowSection>
          
          {/* Location & Contact */}
          <WindowSection title="Location & Contact Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country" style={{ color: `#${theme.textColor}` }}>
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Country
                </Label>
                <Select
                  value={userData.country}
                  onValueChange={(value) => updateUserData('country', value)}
                >
                  <SelectTrigger
                    style={{
                      backgroundColor: `#${theme.bgColor}`,
                      color: `#${theme.textColor}`,
                      borderColor: `#${theme.borderColor}`
                    }}
                  >
                    <SelectValue placeholder="Select your country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((country) => (
                      <SelectItem 
                        key={country.value} 
                        value={country.value}
                        disabled={country.disabled}
                      >
                        {country.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="timezone" style={{ color: `#${theme.textColor}` }}>
                  <Globe className="w-4 h-4 inline mr-1" />
                  Timezone
                </Label>
                <Select
                  value={userData.timezone}
                  onValueChange={(value) => updateUserData('timezone', value)}
                >
                  <SelectTrigger
                    style={{
                      backgroundColor: `#${theme.bgColor}`,
                      color: `#${theme.textColor}`,
                      borderColor: `#${theme.borderColor}`
                    }}
                  >
                    <SelectValue placeholder="Select your timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((timezone) => (
                      <SelectItem 
                        key={timezone.value} 
                        value={timezone.value}
                      >
                        {timezone.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-2" style={{ color: `#${theme.textColor}` }}>
                <Phone className="w-4 h-4" />
                Phone Number (Optional)
              </Label>
              <div className="flex gap-2">
                <Select
                  value={userData.phoneCountryCode}
                  onValueChange={(value) => updateUserData('phoneCountryCode', value)}
                >
                  <SelectTrigger 
                    className="w-36 transition-all duration-200 focus:ring-2 focus:ring-blue-200"
                    style={{
                      backgroundColor: `#${theme.bgColor}`,
                      color: `#${theme.textColor}`,
                      borderColor: `#${theme.borderColor}`
                    }}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PHONE_COUNTRIES.map((country) => (
                      <SelectItem 
                        key={`${country.code}-${country.country}`} 
                        value={country.code}
                      >
                        <div className="flex items-center gap-2">
                          <span>{country.flag}</span>
                          <span className="font-mono">{country.code}</span>
                          <span className="text-xs opacity-70">{country.country}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="90-1234-5678"
                  value={userData.phoneNumber}
                  onChange={(e) => updateUserData('phoneNumber', e.target.value)}
                  className={`flex-1 transition-all duration-200 ${formErrors.phoneNumber ? 'border-red-500 ring-2 ring-red-200' : 'focus:ring-2 focus:ring-blue-200'}`}
                  style={{
                    backgroundColor: `#${theme.bgColor}`,
                    color: `#${theme.textColor}`,
                    borderColor: formErrors.phoneNumber ? '#ef4444' : `#${theme.borderColor}`
                  }}
                />
              </div>
              {formErrors.phoneNumber && (
                <div className="flex items-center gap-1 text-red-500">
                  <AlertTriangle className="w-3 h-3" />
                  <p className="text-xs">{formErrors.phoneNumber}</p>
                </div>
              )}
              <p className="text-xs opacity-70 flex items-center gap-1" style={{ color: `#${theme.textColor}` }}>
                <Shield className="w-3 h-3" />
                Used for order updates and delivery coordination
              </p>
            </div>
          </WindowSection>
        </TabsContent>
        
        {/* Account Settings */}
        <TabsContent value="account" className="space-y-6">
          <WindowSection title="Account Information">
            <div className="space-y-4">
              {userData.isExternalProvider && (
              <div className="p-4 mb-4 border rounded-sm" style={{ 
                borderColor: `#${theme.borderColor}`,
                backgroundColor: `#${theme.bgColor}20`
              }}>
                <div className="flex items-start">
                  <Shield className="w-5 h-5 mr-3 mt-0.5" style={{ color: `#${theme.borderColor}` }} />
                  <div>
                    <h3 className="text-sm font-medium" style={{ color: `#${theme.textColor}` }}>External Authentication</h3>
                    <p className="mt-1 text-sm opacity-80" style={{ color: `#${theme.textColor}` }}>
                      You're signed in using <strong>{userData.provider}</strong>. Some account settings can only be changed through your {userData.provider} account.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 gap-4">
              {/* Username (not editable) */}
              <div className="space-y-2">
                <Label htmlFor="username" style={{ color: `#${theme.textColor}` }}>Username</Label>
                <div className="relative">
                  <Input
                    id="username"
                    value={userData.username}
                    disabled
                    className="pr-8"
                    style={{
                      backgroundColor: `#${theme.bgColor}50`,
                      color: `#${theme.textColor}`,
                      borderColor: `#${theme.borderColor}`
                    }}
                  />
                  <Lock className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 opacity-50" />
                </div>
                <p className="text-xs opacity-70" style={{ color: `#${theme.textColor}` }}>Username cannot be changed</p>
              </div>
              
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2" style={{ color: `#${theme.textColor}` }}>
                  <Globe className="w-4 h-4" />
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={userData.email}
                  onChange={(e) => updateUserData('email', e.target.value)}
                  className={`transition-all duration-200 ${formErrors.email ? 'border-red-500 ring-2 ring-red-200' : 'focus:ring-2 focus:ring-blue-200'}`}
                  style={{
                    backgroundColor: `#${theme.bgColor}`,
                    color: `#${theme.textColor}`,
                    borderColor: formErrors.email ? '#ef4444' : `#${theme.borderColor}`
                  }}
                  placeholder="your.email@example.com"
                  disabled={userData.isExternalProvider}
                />
                {formErrors.email && (
                  <div className="flex items-center gap-1 text-red-500">
                    <AlertTriangle className="w-3 h-3" />
                    <p className="text-xs">{formErrors.email}</p>
                  </div>
                )}
                {!userData.isExternalProvider && (
                  <p className="text-xs opacity-70 flex items-center gap-1" style={{ color: `#${theme.textColor}` }}>
                    <Shield className="w-3 h-3" />
                    Changes to email will require verification
                  </p>
                )}
              </div>
              
              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" style={{ color: `#${theme.textColor}` }}>Password</Label>
                {!changingPassword ? (
                  <div className="flex gap-2">
                    <Input
                      id="password"
                      type="password"
                      value={userData.password}
                      disabled
                      style={{
                        backgroundColor: `#${theme.bgColor}80`,
                        color: `#${theme.textColor}`,
                        borderColor: `#${theme.borderColor}`
                      }}
                    />
                    <WindowButton
                      variant="primary"
                      disabled={userData.isExternalProvider}
                      onClick={() => {
                        if (userData.isExternalProvider) {
                          messageBox.info(
                            `Since you sign in with ${userData.provider}, you manage your password through your ${userData.provider} account settings.`,
                            'External Provider Detected'
                          );
                        } else {
                          directPasswordChange();
                        }
                      }}
                    >
                      Change
                    </WindowButton>
                  </div>
                ) : (
                  <div className="space-y-3 border rounded p-3" style={{ borderColor: `#${theme.borderColor}` }}>
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword" style={{ color: `#${theme.textColor}` }}>Current Password</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter your current password"
                          style={{
                            backgroundColor: `#${theme.bgColor}`,
                            color: `#${theme.textColor}`,
                            borderColor: `#${theme.borderColor}`
                          }}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          style={{ color: `#${theme.textColor}` }}
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="newPassword" style={{ color: `#${theme.textColor}` }}>New Password</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => {
                            setNewPassword(e.target.value);
                            validatePasswordStrength(e.target.value);
                          }}
                          placeholder="Enter your new password"
                          style={{
                            backgroundColor: `#${theme.bgColor}`,
                            color: `#${theme.textColor}`,
                            borderColor: `#${theme.borderColor}`
                          }}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          style={{ color: `#${theme.textColor}` }}
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      
                      {/* Password strength indicator */}
                      {newPassword && (
                        <>
                          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-2">
                            <div 
                              className="h-2.5 rounded-full" 
                              style={{ 
                                width: `${passwordStrength}%`,
                                backgroundColor: passwordStrength < 30 ? '#ef4444' : passwordStrength < 70 ? '#f59e0b' : '#22c55e'
                              }}
                            ></div>
                          </div>
                          <p className="text-xs" style={{ color: `#${theme.textColor}` }}>{passwordFeedback}</p>
                          <div className="text-xs mt-1" style={{ color: `#${theme.textColor}` }}>
                            <p>Password must contain at least one of each:</p>
                            <ul className="list-disc pl-5 mt-1">
                              <li className={/[a-z]/.test(newPassword) ? "text-green-500" : ""}>Lowercase letter (a-z)</li>
                              <li className={/[A-Z]/.test(newPassword) ? "text-green-500" : ""}>Uppercase letter (A-Z)</li>
                              <li className={/[0-9]/.test(newPassword) ? "text-green-500" : ""}>Number (0-9)</li>
                              <li className={/[!@#$%^&*()_\-+\=\[\]{};\':\"\\|<>?,.\\/`~]/.test(newPassword) ? "text-green-500" : ""}>Special character (!@#$...)</li>
                            </ul>
                          </div>
                        </>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" style={{ color: `#${theme.textColor}` }}>Confirm New Password</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm your new password"
                          style={{
                            backgroundColor: `#${theme.bgColor}`,
                            color: `#${theme.textColor}`,
                            borderColor: `#${theme.borderColor}`
                          }}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          style={{ color: `#${theme.textColor}` }}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {newPassword && confirmPassword && newPassword !== confirmPassword && (
                        <p className="text-xs text-red-500">Passwords do not match</p>
                      )}
                    </div>
                    
                    <div className="flex gap-2 justify-end pt-2">
                      <WindowButton
                        variant="secondary"
                        onClick={() => {
                          setChangingPassword(false);
                          setCurrentPassword('');
                          setNewPassword('');
                          setConfirmPassword('');
                          setPasswordStrength(0);
                          setPasswordFeedback('');
                        }}
                      >
                        Cancel
                      </WindowButton>
                      <WindowButton
                        variant="primary"
                        onClick={handlePasswordChange}
                        disabled={saving || !currentPassword || !newPassword || !confirmPassword || passwordStrength < 30 || newPassword !== confirmPassword}
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Updating...</span>
                          </>
                        ) : (
                          <>
                            <Key className="w-4 h-4" />
                            <span>Update Password</span>
                          </>
                        )}
                      </WindowButton>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          </WindowSection>
        </TabsContent>
        
        {/* Preferences */}
        <TabsContent value="preferences" className="space-y-6">
          {/* Languages */}
          <WindowSection title="Languages">
            <div className="space-y-3">
              <Label style={{ color: `#${theme.textColor}` }}>
                <Globe className="w-4 h-4 inline mr-1" />
                Select languages you speak
              </Label>
              <p className="text-sm opacity-70" style={{ color: `#${theme.textColor}` }}>
                This helps others know what languages you can communicate in.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {LANGUAGES.map((language) => (
                  <label
                    key={language.value}
                    className="flex items-center space-x-2 cursor-pointer p-2 rounded border hover:bg-opacity-50"
                    style={{
                      borderColor: `#${theme.borderColor}`,
                      backgroundColor: selectedLanguages.includes(language.value) ? `#${theme.borderColor}20` : 'transparent'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedLanguages.includes(language.value)}
                      onChange={() => toggleLanguage(language.value)}
                      className="rounded"
                      style={{ accentColor: `#${theme.borderColor}` }}
                    />
                    <span className="text-sm" style={{ color: `#${theme.textColor}` }}>
                      {language.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </WindowSection>
          
          {/* Interests */}
          <WindowSection title="Shopping Interests">
            <div className="space-y-4">
              <div>
                <Label style={{ color: `#${theme.textColor}` }}>
                  <Tag className="w-4 h-4 inline mr-1" />
                  What are you interested in buying from Japan?
                </Label>
                <p className="text-sm opacity-70 mt-1" style={{ color: `#${theme.textColor}` }}>
                  Select categories that interest you to help personalize your experience.
                </p>
              </div>
              
              {/* Category tabs */}
              <div className="flex flex-wrap gap-2">
                {Object.keys(INTEREST_CATEGORIES).map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveInterestCategory(category)}
                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                      activeInterestCategory === category ? 'font-medium' : ''
                    }`}
                    style={{
                      borderColor: `#${theme.borderColor}`,
                      backgroundColor: activeInterestCategory === category ? `#${theme.borderColor}` : 'transparent',
                      color: activeInterestCategory === category ? '#FFFFFF' : `#${theme.textColor}`
                    }}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                ))}
              </div>
              
              {/* Interest tags for active category */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium capitalize" style={{ color: `#${theme.textColor}` }}>
                    {activeInterestCategory}
                  </h4>
                  <WindowButton
                    variant="ghost"
                    size="sm"
                    onClick={() => clearInterestCategory(activeInterestCategory)}
                  >
                    Clear All
                  </WindowButton>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {INTEREST_CATEGORIES[activeInterestCategory].map((interest) => (
                    <button
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className={`px-3 py-1 text-sm rounded border transition-colors flex items-center gap-1 ${
                        selectedInterests.includes(interest) ? 'font-medium' : ''
                      }`}
                      style={{
                        borderColor: `#${theme.borderColor}`,
                        backgroundColor: selectedInterests.includes(interest) ? `#${theme.borderColor}20` : 'transparent',
                        color: `#${theme.textColor}`
                      }}
                    >
                      {selectedInterests.includes(interest) && (
                        <Check className="w-3 h-3" />
                      )}
                      {interest}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Selected interests summary */}
              {selectedInterests.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2" style={{ color: `#${theme.textColor}` }}>
                    Selected Interests ({selectedInterests.length})
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedInterests.map((interest) => (
                      <Badge
                        key={interest}
                        variant="secondary"
                        className="text-xs"
                        style={{
                          backgroundColor: `#${theme.borderColor}10`,
                          color: `#${theme.textColor}`,
                          border: `1px solid #${theme.borderColor}30`
                        }}
                      >
                        {interest}
                        <button
                          onClick={() => toggleInterest(interest)}
                          className="ml-1 hover:bg-red-500 hover:text-white rounded-full p-0.5"
                        >
                          <X className="w-2 h-2" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </WindowSection>
        </TabsContent>
        
        {/* Privacy Settings */}
        <TabsContent value="privacy" className="space-y-6">
          <WindowSection title="Profile Visibility">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded" style={{ borderColor: `#${theme.borderColor}` }}>
                <div>
                  <h4 className="font-medium" style={{ color: `#${theme.textColor}` }}>Public Profile</h4>
                  <p className="text-sm opacity-70" style={{ color: `#${theme.textColor}` }}>Allow others to view your profile and listings</p>
                </div>
                <input type="checkbox" defaultChecked className="rounded" style={{ accentColor: `#${theme.borderColor}` }} />
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded" style={{ borderColor: `#${theme.borderColor}` }}>
                <div>
                  <h4 className="font-medium" style={{ color: `#${theme.textColor}` }}>Show Online Status</h4>
                  <p className="text-sm opacity-70" style={{ color: `#${theme.textColor}` }}>Let others see when you're online</p>
                </div>
                <input type="checkbox" defaultChecked className="rounded" style={{ accentColor: `#${theme.borderColor}` }} />
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded" style={{ borderColor: `#${theme.borderColor}` }}>
                <div>
                  <h4 className="font-medium" style={{ color: `#${theme.textColor}` }}>Email Notifications</h4>
                  <p className="text-sm opacity-70" style={{ color: `#${theme.textColor}` }}>Receive email updates about messages and orders</p>
                </div>
                <input type="checkbox" defaultChecked className="rounded" style={{ accentColor: `#${theme.borderColor}` }} />
              </div>
            </div>
          </WindowSection>
          
          <WindowSection title="Data & Privacy">
            <div className="space-y-3">
              <WindowButton variant="secondary" className="w-full justify-start">
                Download Your Data
              </WindowButton>
              <WindowButton variant="secondary" className="w-full justify-start">
                Delete Account
              </WindowButton>
              <p className="text-xs opacity-70" style={{ color: `#${theme.textColor}` }}>
                Account deletion is permanent and cannot be undone. All your data will be removed.
              </p>
            </div>
          </WindowSection>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end mt-6 pt-4 border-t" style={{ borderColor: `#${theme.borderColor}` }}>
        <WindowButton
          onClick={handleSave}
          disabled={saving}
          variant="primary"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </>
          )}
        </WindowButton>
      </div>
    </WindowContainer>
  );
};

export default SettingsPage;