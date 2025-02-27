'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react'; // Import X icon from lucide-react

export default function NewRequestPage() {
  const [user, setUser] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
      } else {
        setUser(user);
      }
    };

    getUser();
  }, [router]);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setUploading(true);
    
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
        
        console.log('Uploading file:', filePath);
        
        // Upload the file to Supabase storage
        const { data, error } = await supabase.storage
          .from('request-images')
          .upload(filePath, file);
          
        if (error) {
          console.error('Supabase storage error:', error);
          throw error;
        }
        
        console.log('Upload success:', data);
        
        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('request-images')
          .getPublicUrl(filePath);
        
        console.log('Public URL:', publicUrl);
        
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
  
  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
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
          title,
          description,
          budget: formattedBudget,
          status: 'open',
          images: images, // This should be an array of image URLs from your upload handler
        },
      ]).select();
  
      if (error) throw error;
  
      // Redirect to the requests list or detail page
      router.push('/requests');
    } catch (error) {
      console.error('Error creating request:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Create New Request</CardTitle>
          <CardDescription>
            Describe the item you're looking for in Japan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Request Title</Label>
              <Input
                id="title"
                placeholder="e.g., Pokemon TCG Charizard Card"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Provide details about what you're looking for, including specific versions, conditions, or other requirements."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">Budget (¥)</Label>
              <Input
                id="budget"
                type="number"
                placeholder="Your maximum budget in Japanese Yen"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
              <p className="text-sm text-gray-500">Leave blank if flexible or unknown</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="images">Reference Images</Label>
              <Input
                id="images"
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                disabled={uploading}
                className="cursor-pointer"
              />
              <p className="text-sm text-gray-500">Upload images to help shoppers find exactly what you want</p>
              {uploading && <p className="text-sm text-blue-500">Uploading images... please wait</p>}
              
              {/* Preview uploaded images */}
              {images.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                  {images.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Reference ${index + 1}`}
                        className="w-full h-32 object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-black/70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-md">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || uploading}>
                {loading ? 'Creating...' : 'Create Request'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}