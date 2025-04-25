'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTheme } from '@/components/layouts/ThemeProvider';
import { useMessageBoxUtils } from './MessageBoxProvider';
import { createClient } from '@supabase/supabase-js';
import { UserCircle, Shield, Save, AlertTriangle, Loader2, Eye, EyeOff, Lock, Key, Upload, X, Camera } from 'lucide-react';

// Supabase client initialization - create once, outside component
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project-url.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// More detailed Supabase connection info
console.log('Supabase configuration:',
  { 
    url: supabaseUrl,
    hasAnonKey: !!supabaseAnonKey,
    anonKeyPrefix: supabaseAnonKey ? supabaseAnonKey.substring(0, 5) + '...' : 'missing'
  }
);

// Test Supabase connection
(async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('Supabase connection test failed:', error);
    } else {
      console.log('Supabase connection test succeeded');
    }
    
    // Test storage access
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error('Supabase storage access test failed:', bucketsError);
        console.error('This could be due to missing storage permissions on your anon key');
      } else {
        console.log('Available storage buckets:', buckets.map(b => b.name).join(', ') || 'No buckets found');
        
        // Check if profiles bucket exists - case-sensitive check
        const profilesBucket = buckets.find(b => b.name === 'profiles');
        if (!profilesBucket) {
          console.log('The "profiles" bucket is not visible to anon key - this is expected with RLS policies');
        } else {
          console.log('"profiles" bucket found with ID:', profilesBucket.id);
        }
      }
    } catch (storageErr) {
      console.error('Supabase storage test exception:', storageErr);
    }
  } catch (err) {
    console.error('Error testing Supabase connection:', err);
  }
})();

console.log('Supabase client initialized with URL:', supabaseUrl);

// Country list for dropdown - defined outside component to prevent recreation
const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", 
  "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", 
  "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", 
  "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", 
  "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia", "Denmark", "Djibouti", "Dominica", 
  "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", 
  "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", 
  "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", 
  "Iran", "Iraq", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", 
  "Korea, North", "Korea, South", "Kosovo", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", 
  "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", 
  "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", 
  "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", 
  "Nigeria", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Panama", "Papua New Guinea", "Paraguay", "Peru", 
  "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", 
  "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", 
  "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", 
  "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", 
  "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", 
  "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", 
  "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

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
  country: 'Japan',
  interests: 'Anime, Manga, Electronics, Fashion',
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
        console.log('Fallback timer triggered - forcing loading to false');
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
          console.error('Auth error:', authError);
          
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
              console.error('Error fetching profile:', error);
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
                avatarUrl: '',
                isExternalProvider: isExternalProvider, // Store provider info
                provider: user.app_metadata?.provider || 'email'
              });
            } else if (profile) {
              // Map database fields to our form fields - be flexible with field names
              let firstName = '';
              let lastName = '';
              let bioText = '';
              let countryValue = '';
              let interestsValue = '';
              let avatarUrlValue = '';
              
              // First name/last name mapping - handle from separate fields or from full_name
              if (profile.first_name) firstName = profile.first_name;
              else if (profile.firstname) firstName = profile.firstname;
              else if (profile.firstName) firstName = profile.firstName;
              else if (profile.fname) firstName = profile.fname;
              // If no first name field but there's a full_name field, parse it
              else if (profile.full_name) {
                const nameParts = profile.full_name.split(' ');
                if (nameParts.length > 0) {
                  firstName = nameParts[0]; // First part is first name
                  if (nameParts.length > 1) {
                    // Rest is last name
                    lastName = nameParts.slice(1).join(' ');
                  }
                }
              }
              
              // Last name mapping (if not already set from full_name)
              if (!lastName) {
                if (profile.last_name) lastName = profile.last_name;
                else if (profile.lastname) lastName = profile.lastname;
                else if (profile.lastName) lastName = profile.lastName;
                else if (profile.lname) lastName = profile.lname;
              }
              
              // Bio mapping
              if (profile.bio) bioText = profile.bio;
              else if (profile.about) bioText = profile.about;
              else if (profile.description) bioText = profile.description;
              
              // Country mapping
              if (profile.country) countryValue = profile.country;
              else if (profile.location) countryValue = profile.location;
              
              // Interests mapping
              if (profile.interests) interestsValue = profile.interests;
              else if (profile.hobbies) interestsValue = profile.hobbies;
              else if (profile.interest) interestsValue = profile.interest;
              else if (profile.hobby) interestsValue = profile.hobby;
              
              // Avatar/profile photo mapping
              if (profile.avatar_url) avatarUrlValue = profile.avatar_url;
              else if (profile.avatarUrl) avatarUrlValue = profile.avatarUrl;
              else if (profile.profile_photo) avatarUrlValue = profile.profile_photo;
              else if (profile.photo_url) avatarUrlValue = profile.photo_url;
              else if (profile.image) avatarUrlValue = profile.image;
              
              // Check if avatarUrl is a storage path and convert to full URL if needed
              if (avatarUrlValue && avatarUrlValue.startsWith('avatars/')) {
                try {
                  const { data: { publicUrl } } = supabase.storage
                    .from('profiles')
                    .getPublicUrl(avatarUrlValue);
                    
                  if (publicUrl) {
                    avatarUrlValue = publicUrl;
                  }
                } catch (storageErr) {
                  console.error('Error getting avatar URL:', storageErr);
                }
              }
              
              // Set the user data with the mapped fields
              setUserData({
                username: profile.username || user.user_metadata?.username || user.email?.split('@')[0] || '',
                email: user.email || '',
                password: '********', // Password is always masked
                firstName: firstName,
                lastName: lastName,
                bio: bioText,
                country: countryValue,
                interests: interestsValue,
                avatarUrl: avatarUrlValue,
                isExternalProvider: isExternalProvider, // Store provider info
                provider: user.app_metadata?.provider || 'email'
              });
              
              if (avatarUrlValue) {
                setPhotoPreview(avatarUrlValue);
              }
            }
          } catch (profileError) {
            console.error('Error in profile fetch:', profileError);
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
        console.error('Unexpected error in fetchUserData:', error);
        
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

  // Update user data
  const updateUserData = (key, value) => {
    setUserData(prev => ({
      ...prev,
      [key]: value
    }));
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
      const filePath = `avatars/${fileName}`;
      
      // Test bucket existence before attempting upload
      try {
        const { error: bucketError } = await supabase.storage
          .from('profiles')
          .list('', { limit: 1 });
          
        if (bucketError) {
          console.error('Cannot access profiles bucket:', bucketError);
          messageBox.error(`Cannot access the storage bucket: ${bucketError.message || 'Unknown error'}`);
          return null;
        }
      } catch (bucketCheckErr) {
        console.error('Exception checking bucket access:', bucketCheckErr);
      }
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profiles')
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
        .from('profiles')
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
        path: filePath,
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
          
          // Extract the path from avatarUrl if it's a full URL
          let storagePath = userData.avatarUrl;
          if (storagePath.includes('storage/v1/object/public/profiles/')) {
            // Extract path from full URL - this is a bit fragile, but works for Supabase URLs
            storagePath = storagePath.split('storage/v1/object/public/profiles/')[1];
          }
          
          // Check if the path is just the filename or includes 'avatars/'
          if (storagePath && !storagePath.startsWith('avatars/')) {
            storagePath = `avatars/${storagePath}`;
          }
          
          console.log('Attempting to delete file at path:', storagePath);
          
          if (storagePath) {
            const { error: deleteError } = await supabase.storage
              .from('profiles')
              .remove([storagePath]);
              
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
        // Build a profile update object that matches the existing schema
        const profileUpdate = {
          user_id: user.id,
          updated_at: new Date().toISOString()
        };
        
        // First name mapping
        if ('firstname' in existingProfile) {
          profileUpdate.firstname = userData.firstName;
        }
        if ('first_name' in existingProfile) {
          profileUpdate.first_name = userData.firstName;
        }
        if ('firstName' in existingProfile) {
          profileUpdate.firstName = userData.firstName;
        }
        if ('fname' in existingProfile) {
          profileUpdate.fname = userData.firstName;
        }
        
        // Last name mapping
        if ('lastname' in existingProfile) {
          profileUpdate.lastname = userData.lastName;
        }
        if ('last_name' in existingProfile) {
          profileUpdate.last_name = userData.lastName;
        }
        if ('lastName' in existingProfile) {
          profileUpdate.lastName = userData.lastName;
        }
        if ('lname' in existingProfile) {
          profileUpdate.lname = userData.lastName;
        }
        
        // Bio mapping
        if ('bio' in existingProfile) {
          profileUpdate.bio = userData.bio;
        }
        if ('about' in existingProfile) {
          profileUpdate.about = userData.bio;
        }
        if ('description' in existingProfile) {
          profileUpdate.description = userData.bio;
        }
        
        // Country mapping
        if ('country' in existingProfile) {
          profileUpdate.country = userData.country;
        }
        if ('location' in existingProfile) {
          profileUpdate.location = userData.country;
        }
        
        // Add username if it exists in schema
        if ('username' in existingProfile) {
          profileUpdate.username = userData.username;
        }
        
        // Handle name fields if they exist
        if ('name' in existingProfile) {
          profileUpdate.name = `${userData.firstName} ${userData.lastName}`.trim();
        }
        if ('full_name' in existingProfile) {
          profileUpdate.full_name = `${userData.firstName} ${userData.lastName}`.trim();
        }
        
        // Always include interests since we've added the column
        profileUpdate.interests = userData.interests;
        
        // Add photo data if available
        if (photoData) {
          // Try different field names for avatar to match schema
          if ('avatar_url' in existingProfile) {
            profileUpdate.avatar_url = photoData.path;
          }
          if ('avatarUrl' in existingProfile) {
            profileUpdate.avatarUrl = photoData.path;
          }
          if ('profile_photo' in existingProfile) {
            profileUpdate.profile_photo = photoData.path;
          }
          if ('photo_url' in existingProfile) {
            profileUpdate.photo_url = photoData.path;
          }
          if ('image' in existingProfile) {
            profileUpdate.image = photoData.path;
          }
          
          // If none of the fields exist, default to avatar_url
          if (!('avatar_url' in existingProfile) && 
              !('avatarUrl' in existingProfile) && 
              !('profile_photo' in existingProfile) && 
              !('photo_url' in existingProfile) && 
              !('image' in existingProfile)) {
            profileUpdate.avatar_url = photoData.path;
          }
        } else if (photoPreview === '') {
          // User removed the photo
          if ('avatar_url' in existingProfile) profileUpdate.avatar_url = null;
          if ('avatarUrl' in existingProfile) profileUpdate.avatarUrl = null;
          if ('profile_photo' in existingProfile) profileUpdate.profile_photo = null;
          if ('photo_url' in existingProfile) profileUpdate.photo_url = null;
          if ('image' in existingProfile) profileUpdate.image = null;
        }
        
        // For existing profiles, use UPDATE instead of UPSERT to avoid conflicts
        
        // Remove user_id from update as it's used in the filter
        const { user_id, ...updateFields } = profileUpdate;
        
        // Update profile in database - use UPDATE for existing profiles
        let profileError;
        try {
          const { error } = await supabase
          .from('profiles')
          .update(updateFields)
          .eq('user_id', user.id);
          
          profileError = error;
        } catch (err) {
          profileError = err;
        }
        
        if (profileError) {
          console.error('Profile update error:', profileError);
          
          // If error is about the interests column, retry without it
          if (profileError.message && profileError.message.includes('interests')) {
            console.log('Error with interests column, retrying without it');
            
            // Remove interests from update fields
            delete updateFields.interests;
            
            // Try update again without interests
            try {
            const { error: retryError } = await supabase
              .from('profiles')
              .update(updateFields)
              .eq('user_id', user.id);
              
            if (retryError) {
                console.error('Profile update error (retry without interests):', retryError);
              messageBox.error('Could not update profile: ' + retryError.message);
              setSaving(false);
              return;
            }
            
            // Store interests in localStorage as fallback
            localStorage.setItem('user_interests', userData.interests);
              console.log('Saved interests to localStorage as fallback');
            } catch (retryErr) {
              console.error('Exception during profile update retry:', retryErr);
              messageBox.error('Could not update profile: ' + retryErr.message);
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
        const profileUpdate = {
          user_id: user.id,
          username: userData.username,
          full_name: `${userData.firstName} ${userData.lastName}`.trim(),
          bio: userData.bio,
          interests: userData.interests
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
        <Button 
          className="mt-4 text-sm"
          onClick={() => {
            setLoading(false);
            setUserData(DEMO_USER_DATA);
          }}
          style={{
            backgroundColor: `#${theme.buttonBgColor || 'D4D0C8'}`,
            color: `#000000`,
            borderColor: '#888888',
            boxShadow: 'inset 2px 2px 0 #FFFFFF, inset -2px -2px 0 #808080',
            opacity: loading ? 0.5 : 1
          }}
        >
          Skip Loading
        </Button>
      </div>
    );
  }

  return (
    <div 
      className={`${isWindowView ? 'p-4' : 'p-6 bg-white rounded-lg shadow'}`}
      style={isWindowView ? { backgroundColor: `#${theme.bgColor}` } : {}}
    >
      <h1 className="text-xl font-bold mb-6" style={{ color: `#${theme.textColor}` }}>
        User Settings
      </h1>

      <Tabs defaultValue="account" className="w-full">
        <TabsList 
          className="grid grid-cols-2 mb-4"
          style={{
            backgroundColor: `#${theme.bgColor}`,
            borderColor: `#${theme.borderColor}`,
            padding: '1px'
          }}
        >
          <TabsTrigger 
            value="account"
            className="flex items-center gap-1 border"
            style={{
              backgroundColor: `#${theme.buttonBgColor || 'D4D0C8'} !important`,
              color: `#000000`,
              borderColor: '#888888',
              boxShadow: 'inset 2px 2px 0 #FFFFFF, inset -2px -2px 0 #808080'
            }}
          >
            <UserCircle className="w-4 h-4" />
            <span>Account</span>
          </TabsTrigger>
          <TabsTrigger 
            value="profile"
            className="flex items-center gap-1 border"
            style={{
              backgroundColor: `#${theme.buttonBgColor || 'D4D0C8'} !important`,
              color: `#000000`,
              borderColor: '#888888',
              boxShadow: 'inset 2px 2px 0 #FFFFFF, inset -2px -2px 0 #808080'
            }}
          >
            <Shield className="w-4 h-4" />
            <span>Profile</span>
          </TabsTrigger>
        </TabsList>

        {/* Account Settings */}
        <TabsContent value="account" className="space-y-4 border p-4 rounded-sm" style={{ borderColor: `#${theme.borderColor}` }}>
          <div className="space-y-4">
            <h3 className="font-medium text-lg mb-4" style={{ color: `#${theme.textColor}` }}>
              Account Settings
            </h3>
            
            {userData.isExternalProvider && (
              <div className="p-3 mb-4 border rounded-sm bg-blue-50" style={{ borderColor: `#${theme.borderColor}` }}>
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-0.5">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 18.3333C14.6024 18.3333 18.3334 14.6023 18.3334 9.99996C18.3334 5.39759 14.6024 1.66663 10 1.66663C5.39765 1.66663 1.66669 5.39759 1.66669 9.99996C1.66669 14.6023 5.39765 18.3333 10 18.3333Z" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M10 6.66663V9.99996" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M10 13.3334H10.0083" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">External Authentication</h3>
                    <div className="mt-1 text-sm text-blue-700">
                      <p>You're signed in using <strong>{userData.provider}</strong>. Some account settings can only be changed through your {userData.provider} account.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 gap-4">
              {/* Username (not editable) */}
              <div className="space-y-2">
                <Label htmlFor="username" style={{ color: `#${theme.textColor}` }}>Username</Label>
                <Input
                  id="username"
                  value={userData.username}
                  disabled
                  style={{
                    backgroundColor: `#${theme.bgColor}80`,
                    color: `#${theme.textColor}`,
                    borderColor: `#${theme.borderColor}`
                  }}
                />
                <p className="text-xs opacity-70" style={{ color: `#${theme.textColor}` }}>Username cannot be changed</p>
              </div>
              
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" style={{ color: `#${theme.textColor}` }}>Email Address</Label>
                  <div className="flex gap-2">
                    <Input
                      id="email"
                      type="email"
                      value={userData.email}
                    disabled={true}
                      style={{
                        backgroundColor: `#${theme.bgColor}`,
                        color: `#${theme.textColor}`,
                        borderColor: `#${theme.borderColor}`
                      }}
                    />
                  </div>
                <p className="text-xs opacity-70" style={{ color: `#${theme.textColor}` }}>Email cannot be changed directly. Please contact support if you need to update your email.</p>
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
                    <Button
                      type="button"
                      variant="vintageActive"
                      className={userData.isExternalProvider ? "opacity-50" : ""}
                      onClick={() => {
                        console.log('🚨 PASSWORD BUTTON CLICKED');
                        if (userData.isExternalProvider) {
                          messageBox.info(
                            `Since you sign in with ${userData.provider}, you manage your password through your ${userData.provider} account settings.`,
                            'External Provider Detected'
                          );
                        } else {
                          directPasswordChange();
                        }
                      }}
                      disabled={userData.isExternalProvider}
                    >
                      Change
                    </Button>
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
                      <Button
                        type="button"
                        variant="vintage"
                        onClick={() => {
                          console.log('🚨 CANCEL PASSWORD BUTTON CLICKED');
                          setChangingPassword(false);
                          setCurrentPassword('');
                          setNewPassword('');
                          setConfirmPassword('');
                          setPasswordStrength(0);
                          setPasswordFeedback('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        variant="vintageActive"
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
                      </Button>
                    </div>
                  </div>
                )}
            </div>
            
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" style={{ color: `#${theme.textColor}` }}>Email Address</Label>
                <div className="flex gap-2">
                  <Input
                    id="email"
                    type="email"
                    value={userData.email}
                    disabled={true}
                    style={{
                      backgroundColor: `#${theme.bgColor}`,
                      color: `#${theme.textColor}`,
                      borderColor: `#${theme.borderColor}`
                    }}
                  />
                </div>
                <p className="text-xs opacity-70" style={{ color: `#${theme.textColor}` }}>Email cannot be changed directly. Please contact support if you need to update your email.</p>
              </div>
            </div>
          </div>
        </TabsContent>
        
        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-4 border p-4 rounded-sm" style={{ borderColor: `#${theme.borderColor}` }}>
          <div className="space-y-4">
            <h3 className="font-medium text-lg mb-4" style={{ color: `#${theme.textColor}` }}>
              Profile Settings
            </h3>
            
            {/* Profile Photo - Add back the photo upload UI */}
            <div className="flex flex-col items-center space-y-3 mb-6 pb-4 border-b" style={{ borderColor: `#${theme.borderColor}` }}>
              <div className="relative w-32 h-32 flex items-center justify-center">
                <div 
                  className={`relative w-24 h-24 rounded-full overflow-hidden border-2 flex items-center justify-center bg-gray-100 ${dragActive ? 'ring-2 ring-blue-500' : ''}`}
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
                    />
                  ) : (
                    <UserCircle className="w-16 h-16 text-gray-400" />
                  )}
                </div>
                
                {/* Remove button - Placed outside the image container */}
                {photoPreview && (
                  <div className="absolute top-0 right-0 translate-x-1 -translate-y-1">
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full shadow-md"
                      title="Remove photo"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col items-center">
                <Label 
                  htmlFor="profilePhoto" 
                  className="mb-2"
                  style={{ color: `#${theme.textColor}` }}
                >
                  Profile Photo
                </Label>
                
                <div 
                  className={`w-full max-w-xs p-4 border-2 border-dashed rounded-sm flex flex-col items-center justify-center cursor-pointer mb-2 ${dragActive ? 'border-blue-500 bg-blue-50' : ''}`}
                  style={{ 
                    borderColor: dragActive ? '' : `#${theme.borderColor}`,
                    backgroundColor: `#${theme.buttonBgColor || 'D4D0C8'}40`,
                    boxShadow: '2px 2px 0 #FFFFFF inset, -2px -2px 0 #808080 inset'
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Upload className="w-8 h-8 mb-2" style={{ color: `#${theme.textColor}` }} />
                  <p className="text-sm text-center" style={{ color: `#${theme.textColor}` }}>
                    Click to browse or drag and drop your photo here
                  </p>
                </div>
                
                <input
                  id="profilePhoto"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                
                <p className="text-xs mt-2 text-center max-w-xs" style={{ color: `#${theme.textColor}` }}>
                  Upload a photo (max. 2MB) to personalize your profile. JPG, PNG, or GIF formats are supported.
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {/* First Name */}
              <div className="space-y-2">
                <Label htmlFor="firstName" style={{ color: `#${theme.textColor}` }}>First Name</Label>
                <Input
                  id="firstName"
                  value={userData.firstName}
                  onChange={(e) => updateUserData('firstName', e.target.value)}
                  style={{
                    backgroundColor: `#${theme.bgColor}`,
                    color: `#${theme.textColor}`,
                    borderColor: `#${theme.borderColor}`
                  }}
                />
              </div>
              
              {/* Last Name */}
              <div className="space-y-2">
                <Label htmlFor="lastName" style={{ color: `#${theme.textColor}` }}>Last Name</Label>
                <Input
                  id="lastName"
                  value={userData.lastName}
                  onChange={(e) => updateUserData('lastName', e.target.value)}
                  style={{
                    backgroundColor: `#${theme.bgColor}`,
                    color: `#${theme.textColor}`,
                    borderColor: `#${theme.borderColor}`
                  }}
                />
              </div>
              
              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio" style={{ color: `#${theme.textColor}` }}>Bio</Label>
                <Textarea
                  id="bio"
                  value={userData.bio}
                  onChange={(e) => updateUserData('bio', e.target.value)}
                  style={{
                    backgroundColor: `#${theme.bgColor}`,
                    color: `#${theme.textColor}`,
                    borderColor: `#${theme.borderColor}`
                  }}
                />
              </div>
              
              {/* Country */}
              <div className="space-y-2">
                <Label htmlFor="country" style={{ color: `#${theme.textColor}` }}>Country</Label>
                <Input
                  id="country"
                  value={userData.country}
                  onChange={(e) => updateUserData('country', e.target.value)}
                  style={{
                    backgroundColor: `#${theme.bgColor}`,
                    color: `#${theme.textColor}`,
                    borderColor: `#${theme.borderColor}`
                  }}
                />
              </div>
              
              {/* Interests */}
              <div className="space-y-2">
                <Label htmlFor="interests" style={{ color: `#${theme.textColor}` }}>Interests</Label>
                <Textarea
                  id="interests"
                  value={userData.interests}
                  onChange={(e) => updateUserData('interests', e.target.value)}
                  style={{
                    backgroundColor: `#${theme.bgColor}`,
                    color: `#${theme.textColor}`,
                    borderColor: `#${theme.borderColor}`
                  }}
                />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end mt-6 pt-4 border-t" style={{ borderColor: `#${theme.borderColor}` }}>
        <Button
          onClick={handleSave}
          disabled={saving}
          variant="vintageActive"
          className="flex items-center gap-1"
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
        </Button>
      </div>
    </div>
  );
};

export default SettingsPage;