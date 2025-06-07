'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useDialog } from '@/components/windows/MessageBox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UploadCloud, X, Camera, Info } from 'lucide-react';
import Image from 'next/image';
import { useTheme } from '@/components/layouts/ThemeProvider';

/**
 * ListingPage component - For creating new listings
 */
const ListingPage = ({ isWindowView = true }) => {
  const { theme } = useTheme();
  const router = useRouter();
  const dialog = useDialog();
  const fileInputRef = useRef(null);
  
  // Theme colors
  const borderColor = theme?.borderColor || '69EFD7';
  const bgColor = theme?.bgColor || 'FED1EB';
  
  // State for the form
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [photos, setPhotos] = useState({
    cover: null,
    front: null,
    back: null,
    side: null,
    label: null,
    detail: null,
    flaw: null,
    extra: []
  });
  
  // Form data state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [condition, setCondition] = useState('');
  const [colors, setColors] = useState([]);
  const [source, setSource] = useState('');
  const [age, setAge] = useState('');
  const [style, setStyle] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [city, setCity] = useState('');
  
  // Categories map
  const categories = {
    collectibles: [
      "Action Figures", 
      "Trading Cards", 
      "Gachapon/Capsule Toys", 
      "Model Kits", 
      "Anime Merchandise", 
      "Plush Toys", 
      "Vintage Toys", 
      "Limited Edition Items",
      "Board Games", 
      "Miniatures",
      "Comic Books/Manga",
      "Pop Culture Memorabilia"
    ],
    toys: [
      "Dolls", 
      "Building Blocks", 
      "Electronic Toys", 
      "Puzzles", 
      "Educational Toys", 
      "Outdoor Toys"
    ],
    gaming: [
      "Video Games", 
      "Consoles", 
      "Gaming Accessories", 
      "Retro Gaming", 
      "PC Gaming"
    ],
    apparel: [
      "T-shirts", 
      "Hoodies", 
      "Caps/Hats", 
      "Cosplay", 
      "Accessories"
    ],
    other: [
      "Art Prints", 
      "Stationery", 
      "Home Decor", 
      "Music/CDs", 
      "Books"
    ]
  };
  
  // Condition options
  const conditionOptions = [
    "New in Box (NIB)",
    "Mint in Box (MIB)",
    "Sealed/Unopened",
    "Complete in Box (CIB)",
    "New without Box/Tags",
    "Displayed Only",
    "Used - Like New",
    "Used - Good",
    "Used - Fair",
    "For Parts/Repair"
  ];
  
  // Rarity options
  const rarityOptions = [
    "Common", 
    "Uncommon", 
    "Rare", 
    "Super Rare", 
    "Ultra Rare", 
    "Limited Edition", 
    "Exclusive", 
    "Promo/Event",
    "Chase/Secret"
  ];
  
  // Color options
  const colorOptions = [
    "Black", "White", "Red", "Blue", "Green", "Yellow", 
    "Purple", "Pink", "Orange", "Brown", "Grey", "Multi",
    "Gold", "Silver", "Bronze", "Clear", "Glow in the Dark",
    "Metallic", "Chrome", "Transparent", "Holographic"
  ];
  
  // Source options
  const sourceOptions = [
    "Retail Store", "Online Shop", "Collector Fair", "Auction", 
    "Trading", "Second-hand Store", "Gatcha/Capsule Machine", 
    "Convention/Event", "Gift", "Personal Collection"
  ];
  
  // Style options
  const styleOptions = [
    "Anime/Manga", "Western Animation", "Gaming", "Pop Culture", 
    "Movie/TV", "Sports", "Designer Toys", "Retro/Vintage", 
    "Sci-Fi", "Fantasy", "Chibi/Cute", "Realistic", "Art Toy"
  ];
  
  // Age options (for item age)
  const ageOptions = [
    "Brand new (Current release)", 
    "Recent (Last 1-2 years)", 
    "Modern (3-5 years old)", 
    "Semi-vintage (5-10 years old)", 
    "Vintage (10-20 years old)", 
    "Retro (20-30 years old)", 
    "Antique (30+ years old)"
  ];
  
  // Series/Franchise options
  const seriesOptions = [
    "Pokémon", 
    "Dragon Ball", 
    "Marvel", 
    "DC", 
    "Star Wars", 
    "Sanrio", 
    "Nintendo", 
    "Ghibli",
    "Gundam",
    "Disney",
    "Other (specify in description)"
  ];
  
  // Era/Year options
  const eraOptions = [
    "2020s", 
    "2010s", 
    "2000s", 
    "1990s", 
    "1980s", 
    "1970s", 
    "Vintage (Pre-1970s)"
  ];
  
  // Package condition options
  const packageConditionOptions = [
    "Mint",
    "Near Mint",
    "Very Good",
    "Good",
    "Fair",
    "Poor",
    "No Packaging"
  ];
  
  // Metadata for algorithm usage
  const [rarity, setRarity] = useState('');
  const [series, setSeries] = useState('');
  const [era, setEra] = useState('');
  const [packageCondition, setPackageCondition] = useState('');
  const [tags, setTags] = useState([]);
  const [customTag, setCustomTag] = useState('');
  
  // Get current user on component mount
  React.useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        setUser(user);
        
        // Set default location from user profile
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('location')
            .eq('user_id', user.id)
            .single();
            
          if (profile?.location) {
            setLocation('United States'); // Default country
            setCity(profile.location);
          }
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        dialog?.showError('Authentication Error', 'Please log in to list items.');
      }
    };
    
    getUser();
  }, [dialog]);
  
  // Handle photo upload
  const handlePhotoUpload = (e, position) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file type
    const fileType = file.type;
    if (!fileType.includes('image/jpeg') && !fileType.includes('image/png')) {
      dialog?.showError('Invalid File', 'Please upload only JPEG or PNG images.');
      return;
    }
    
    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      dialog?.showError('File Too Large', 'Please upload images smaller than 5MB.');
      return;
    }
    
    // Create a preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      if (position === 'extra') {
        // Add to extra photos array
        setPhotos(prev => ({
          ...prev,
          extra: [...prev.extra, { file, preview: e.target.result }]
        }));
      } else {
        // Set a specific position
        setPhotos(prev => ({
          ...prev,
          [position]: { file, preview: e.target.result }
        }));
      }
    };
    reader.readAsDataURL(file);
  };
  
  // Remove a photo
  const removePhoto = (position, index = null) => {
    if (position === 'extra' && index !== null) {
      // Remove from extras array
      setPhotos(prev => ({
        ...prev,
        extra: prev.extra.filter((_, i) => i !== index)
      }));
    } else {
      // Remove a specific position
      setPhotos(prev => ({ ...prev, [position]: null }));
    }
  };
  
  // Add custom tag
  const addCustomTag = () => {
    if (customTag && !tags.includes(customTag) && tags.length < 10) {
      setTags([...tags, customTag]);
      setCustomTag('');
    }
  };

  // Remove tag
  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      dialog?.showError('Authentication Error', 'Please log in to list items.');
      return;
    }
    
    if (!photos.cover) {
      dialog?.showError('Missing Photo', 'Please upload at least a cover photo.');
      return;
    }
    
    if (!title.trim()) {
      dialog?.showError('Missing Title', 'Please enter a title for your item.');
      return;
    }
    
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      dialog?.showError('Invalid Price', 'Please enter a valid price.');
      return;
    }
    
    if (!category) {
      dialog?.showError('Missing Category', 'Please select a category.');
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Initialize image URLs array - we'll use this regardless of storage success
      let imageUrls = [];
      
      try {
        // Use existing product bucket - don't try to create it
        console.log('Attempting to upload photos to products bucket...');
        
        // Now try to upload photos
        const photoPositions = ['cover', 'front', 'back', 'side', 'label', 'detail', 'flaw'];
        
        // Upload position-specific photos
        for (const position of photoPositions) {
          if (photos[position]) {
            const file = photos[position].file;
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${position}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;
            
            try {
              console.log(`Uploading ${position} photo to ${filePath}`);
              const { error: uploadError } = await supabase.storage
                .from('listings')
                .upload(filePath, file);
                
              if (uploadError) {
                console.error(`Error uploading ${position} photo:`, uploadError);
                imageUrls.push(`https://via.placeholder.com/500x500?text=${position}`);
              } else {
                const { data: urlData } = supabase.storage
                  .from('listings')
                  .getPublicUrl(filePath);
                  
                imageUrls.push(urlData.publicUrl);
                console.log(`Successfully uploaded ${position} photo:`, urlData.publicUrl);
              }
            } catch (uploadError) {
              console.error(`Upload error for ${position}:`, uploadError);
              imageUrls.push(`https://via.placeholder.com/500x500?text=${position}`);
            }
          }
        }
        
        // Upload extra photos
        for (const extraPhoto of photos.extra) {
          const file = extraPhoto.file;
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-extra-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `${user.id}/${fileName}`;
          
          try {
            const { error: uploadError } = await supabase.storage
              .from('listings')
              .upload(filePath, file);
              
            if (uploadError) {
              console.error('Error uploading extra photo:', uploadError);
              imageUrls.push('https://via.placeholder.com/500x500?text=extra');
            } else {
              const { data: urlData } = supabase.storage
                .from('listings')
                .getPublicUrl(filePath);
                
              imageUrls.push(urlData.publicUrl);
            }
          } catch (uploadError) {
            console.error('Upload error for extra photo:', uploadError);
            imageUrls.push('https://via.placeholder.com/500x500?text=extra');
          }
        }
      } catch (storageError) {
        console.error('Storage system error:', storageError);
        // If we completely fail with storage, use placeholders
        imageUrls = ['https://via.placeholder.com/500x500?text=No+Image'];
      }
      
      // Ensure we have at least one image URL
      if (imageUrls.length === 0) {
        imageUrls = ['https://via.placeholder.com/500x500?text=No+Image'];
      }
      
      // Now create the product in the database
      console.log('Creating listing in database...');
      const listingData = {
        user_id: user.id,
        title,
        description,
        category,
        subcategory,
        condition,
        price: parseFloat(price),
        location: city,
        country: location,
        photos: imageUrls,
        created_at: new Date().toISOString(),
        // Additional fields for algorithm
        rarity: rarity || null,
        series: series || null,
        era: era || null,
        package_condition: packageCondition || null,
        tags: tags.length > 0 ? tags : null,
        colors: colors.length > 0 ? colors : null,
        style: style || null,
        algorithm_data: {
          view_count: 0,
          like_count: 0,
          save_count: 0,
          click_through_rate: 0,
          user_interactions: []
        }
      };
      
      const { data, error } = await supabase
        .from('listings')
        .insert([listingData])
        .select();
      
      if (error) {
        console.error('Database insert error:', error);
        throw error;
      }
      
      console.log('Listing created successfully:', data);
      
      // Show success message - using showError method since showSuccess is not available
      dialog?.showError(
        'Your item has been listed successfully.',
        'Success!', 
        ['OK'],
        () => {
          // Clear form
          setTitle('');
          setDescription('');
          setCategory('');
          setSubcategory('');
          setCondition('');
          setColors([]);
          setSource('');
          setAge('');
          setStyle('');
          setPhotos({ cover: null, front: null, back: null, side: null, label: null, detail: null, flaw: null, extra: [] });
          setRarity('');
          setSeries('');
          setEra('');
          setPackageCondition('');
          setTags([]);
          setCustomTag('');
          
          // Redirect to item page
          try {
            if (data && data[0] && data[0].id) {
              router.push(`/item/${data[0].id}`);
            } else {
              router.push('/explore');
            }
          } catch (navError) {
            console.error('Navigation error:', navError);
            // If navigation fails, at least the form is cleared
          }
        }
      );
    } catch (error) {
      console.error('Error creating listing:', error);
      
      // Show a more user-friendly error with specific details
      const errorMessage = error.message || 'Unknown error occurred';
      dialog?.showError(
        `We had trouble creating your listing: ${errorMessage}. Please try again or contact support if the issue persists.`,
        'Listing Error', 
        ['OK'],
        () => setSubmitting(false)
      );
    } finally {
      setSubmitting(false);
    }
  };
  
  // Render photo upload area
  const renderPhotoArea = (position, label) => {
    const photo = photos[position];
    
    return (
      <div className="relative border border-dashed rounded-md p-2 flex flex-col items-center justify-center h-28 text-center overflow-hidden">
        {photo ? (
          <>
            <Image 
              src={photo.preview} 
              alt={`${label} preview`}
              fill
              className="object-cover"
            />
            <button 
              onClick={() => removePhoto(position)}
              className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-md"
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <>
            <input
              type="file"
              accept="image/jpeg, image/png"
              className="hidden"
              onChange={(e) => handlePhotoUpload(e, position)}
              ref={fileInputRef}
            />
            <button 
              type="button"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/jpeg, image/png';
                input.onchange = (e) => handlePhotoUpload(e, position);
                input.click();
              }}
              className="w-full h-full flex flex-col items-center justify-center text-gray-500 hover:text-gray-700"
            >
              <Camera size={16} className="mb-1" />
              <span className="text-xs">{label}</span>
            </button>
          </>
        )}
      </div>
    );
  };
  
  return (
    <div className={`h-full flex flex-col ${isWindowView ? 'bg-white' : 'bg-gray-50'}`}>
      <div className="flex-1 overflow-auto">
        <div className="p-4">
          <h1 className="text-xl font-bold mb-6">List an item</h1>
          
          <form onSubmit={handleSubmit}>
            {/* Photos section */}
            <div className="mb-6">
              <h2 className="font-semibold mb-1">Photos</h2>
              <p className="text-sm text-gray-500 mb-2">Add up to 8 photos in JPEG or PNG format</p>
              
              <div className="grid grid-cols-4 gap-2">
                {renderPhotoArea('cover', 'Cover photo')}
                {renderPhotoArea('front', 'Front')}
                {renderPhotoArea('back', 'Back')}
                {renderPhotoArea('side', 'Side')}
              </div>
              
              <div className="grid grid-cols-4 gap-2 mt-2">
                {renderPhotoArea('label', 'Label')}
                {renderPhotoArea('detail', 'Detail')}
                {renderPhotoArea('flaw', 'Flaw')}
                
                {/* Add from phone button */}
                <div className="border border-dashed rounded-md p-2 flex flex-col items-center justify-center h-28 text-center">
                  <button 
                    type="button"
                    className="w-full h-full flex flex-col items-center justify-center text-gray-500 hover:text-gray-700"
                  >
                    <UploadCloud size={16} className="mb-1" />
                    <span className="text-xs">Add photos from a phone or tablet</span>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Description section */}
            <div className="mb-6">
              <h2 className="font-semibold mb-2">Description</h2>
              
              {/* Title field */}
              <div className="mb-4">
                <Label htmlFor="title" className="text-sm block mb-1">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a descriptive title for your item"
                  maxLength={100}
                />
                <div className="flex justify-end mt-1">
                  <span className="text-xs text-gray-500">
                    {title.length} / 100
                  </span>
                </div>
              </div>
              
              <Textarea 
                placeholder="Describe your collectible item in detail (brand, size, condition details, etc.)" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="resize-none"
                rows={4}
              />
              <div className="flex justify-end mt-1">
                <span className="text-xs text-gray-500">
                  {description.length} / 1000
                </span>
              </div>
            </div>
            
            {/* Info section */}
            <div className="mb-6">
              <h2 className="font-semibold mb-2">Info</h2>
              
              {/* Category */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="collectibles">Collectibles</SelectItem>
                      <SelectItem value="toys">Toys</SelectItem>
                      <SelectItem value="gaming">Gaming</SelectItem>
                      <SelectItem value="apparel">Apparel</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {category && (
                  <div>
                    <Label htmlFor="subcategory">Subcategory</Label>
                    <Select value={subcategory} onValueChange={setSubcategory}>
                      <SelectTrigger id="subcategory">
                        <SelectValue placeholder="Select a subcategory" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories[category]?.map((sub) => (
                          <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              
              {/* Condition */}
              <div>
                <Label htmlFor="condition">Condition</Label>
                <Select value={condition} onValueChange={setCondition}>
                  <SelectTrigger id="condition">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {conditionOptions.map((option) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Enhance your listing section */}
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <h2 className="font-semibold">Enhance your listing</h2>
                <a href="#" className="text-blue-500 text-xs ml-2 flex items-center">
                  Learn more about how we use tags in search <Info size={12} className="ml-1" />
                </a>
              </div>
              
              {/* Color */}
              <div className="mb-3">
                <Label htmlFor="color" className="text-sm block mb-1">Colour</Label>
                <Select value={colors[0] || ''} onValueChange={(value) => setColors([value])}>
                  <SelectTrigger id="color">
                    <SelectValue placeholder="Select up to two colours" />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map((option) => (
                      <SelectItem key={option} value={option.toLowerCase()}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-xs text-gray-500 mt-1">Select up to two colours</div>
              </div>
              
              {/* Source */}
              <div className="mb-3">
                <Label htmlFor="source" className="text-sm block mb-1">Source</Label>
                <Select value={source} onValueChange={setSource}>
                  <SelectTrigger id="source">
                    <SelectValue placeholder="What kind of item is this? Add up to 2" />
                  </SelectTrigger>
                  <SelectContent>
                    {sourceOptions.map((option) => (
                      <SelectItem key={option} value={option.toLowerCase().replace(/\s+/g, '-')}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-xs text-gray-500 mt-1">What kind of item is this? Add up to 2</div>
              </div>
              
              {/* Age */}
              <div className="mb-3">
                <Label htmlFor="age" className="text-sm block mb-1">Age</Label>
                <Select value={age} onValueChange={setAge}>
                  <SelectTrigger id="age">
                    <SelectValue placeholder="Do you know when this item was made? Add up to 1" />
                  </SelectTrigger>
                  <SelectContent>
                    {ageOptions.map((option) => (
                      <SelectItem key={option} value={option.toLowerCase().replace(/\s+/g, '-')}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-xs text-gray-500 mt-1">Do you know when this item was made? Add up to 1</div>
              </div>
              
              {/* Style */}
              <div className="mb-3">
                <Label htmlFor="style" className="text-sm block mb-1">Style</Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger id="style">
                    <SelectValue placeholder="Pick relevant tags to describe this item's style. Add up to 3" />
                  </SelectTrigger>
                  <SelectContent>
                    {styleOptions.map((option) => (
                      <SelectItem key={option} value={option.toLowerCase()}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-xs text-gray-500 mt-1">Pick relevant tags to describe this item's style. Add up to 3</div>
              </div>
              
              {/* Custom Tags */}
              <div>
                <Label htmlFor="tags">Tags (up to 10)</Label>
                <div className="flex space-x-2">
                  <Input 
                    id="customTag" 
                    value={customTag} 
                    onChange={(e) => setCustomTag(e.target.value)} 
                    placeholder="Add a tag"
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    onClick={addCustomTag} 
                    disabled={!customTag || tags.length >= 10}
                  >
                    Add
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag) => (
                      <div key={tag} className="bg-accent/20 text-sm px-2 py-1 rounded-md flex items-center">
                        {tag}
                        <button 
                          type="button" 
                          className="ml-1 text-muted-foreground"
                          onClick={() => removeTag(tag)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Location section */}
            <div className="mb-6">
              <h2 className="font-semibold mb-2">Location</h2>
              
              {/* Country */}
              <div className="mb-3">
                <Label htmlFor="country" className="text-sm block mb-1">Country</Label>
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger id="country">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="United States">United States</SelectItem>
                    <SelectItem value="Japan">Japan</SelectItem>
                    <SelectItem value="Canada">Canada</SelectItem>
                    <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-xs text-gray-500 mt-1">Your location is based on your profile settings</div>
              </div>
              
              {/* City */}
              <div className="mb-3">
                <Label htmlFor="city" className="text-sm block mb-1">City</Label>
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger id="city">
                    <SelectValue placeholder="Select your city from the dropdown list" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new-york">New York</SelectItem>
                    <SelectItem value="los-angeles">Los Angeles</SelectItem>
                    <SelectItem value="chicago">Chicago</SelectItem>
                    <SelectItem value="houston">Houston</SelectItem>
                    <SelectItem value="phoenix">Phoenix</SelectItem>
                    <SelectItem value="philadelphia">Philadelphia</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-xs text-gray-500 mt-1">Select your city from the dropdown list</div>
              </div>
            </div>
            
            {/* Item price section */}
            <div className="mb-6">
              <h2 className="font-semibold mb-2">Item price</h2>
              
              <div className="mb-3">
                <Label htmlFor="price" className="text-sm block mb-1">Item price</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">USD $</span>
                  </div>
                  <Input
                    type="text"
                    id="price"
                    value={price}
                    onChange={(e) => {
                      // Only allow numbers and a decimal point
                      const value = e.target.value;
                      if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                        setPrice(value);
                      }
                    }}
                    className="pl-16 pr-12"
                    placeholder="0.00"
                  />
                  {price && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <button 
                        type="button" 
                        onClick={() => setPrice('')}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Submit button */}
            <div className="flex justify-center mb-4">
              <Button
                type="submit"
                disabled={submitting}
                className={`w-full md:w-auto ${submitting ? 'opacity-70' : ''}`}
                style={{
                  backgroundColor: `#${borderColor}`,
                  color: getContrastText(borderColor)
                }}
              >
                {submitting ? 'Listing...' : 'List Item'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Helper function to determine text color based on background
const getContrastText = (hexColor) => {
  // Convert hex to RGB
  const r = parseInt(hexColor.substr(0, 2), 16);
  const g = parseInt(hexColor.substr(2, 2), 16);
  const b = parseInt(hexColor.substr(4, 2), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return white for dark colors, black for light
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

export default ListingPage; 