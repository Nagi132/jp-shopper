'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, X, Upload, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

/**
 * Component for shoppers to submit actual shipping costs with evidence
 * - Allows uploading shipping receipts
 * - Reports actual shipping costs
 * - Handles additional cost approval process
 */
export default function ShippingVerification({ 
  requestId,
  estimatedShippingCost = 0,
  onSubmitSuccess,
  className = ""
}) {
  const [actualCost, setActualCost] = useState(estimatedShippingCost);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [receiptImages, setReceiptImages] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  
  const fileInputRef = useRef(null);
  
  const costDifference = actualCost - estimatedShippingCost;
  const needsAdditionalPayment = costDifference > 0;
  
  // Handle file selection for image upload
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setUploading(true);
    setError(null);
    
    try {
      const newPreviews = [];
      const newReceiptImages = [];
      
      for (const file of files) {
        // Check file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
          setError('File size exceeds 5MB limit');
          continue;
        }
        
        // Create preview URL
        const previewUrl = URL.createObjectURL(file);
        newPreviews.push(previewUrl);
        
        // Create a unique file name
        const fileName = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
        const filePath = `shipping-receipts/${requestId}/${fileName}`;
        
        // Upload the file to Supabase storage
        const { data, error } = await supabase.storage
          .from('shipping-receipts')
          .upload(filePath, file);
          
        if (error) {
          console.error('Upload error:', error);
          setError('Failed to upload image. Please try again.');
          continue;
        }
        
        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('shipping-receipts')
          .getPublicUrl(filePath);
          
        newReceiptImages.push({
          url: publicUrl,
          path: filePath,
          name: fileName
        });
      }
      
      if (newReceiptImages.length > 0) {
        setReceiptImages(prev => [...prev, ...newReceiptImages]);
        setImagePreview(prev => [...prev, ...newPreviews]);
      }
    } catch (err) {
      console.error('Error uploading receipt:', err);
      setError('Failed to upload receipt. Please try again.');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // Remove an image from the receipt list
  const removeImage = (index) => {
    setReceiptImages(prev => prev.filter((_, i) => i !== index));
    setImagePreview(prev => prev.filter((_, i) => i !== index));
  };
  
  // Submit the shipping verification
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (receiptImages.length === 0) {
      setError('Please upload at least one receipt image');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      // Create a shipping verification record
      const { data, error } = await supabase
        .from('shipping_verifications')
        .insert({
          request_id: requestId,
          estimated_cost: estimatedShippingCost,
          actual_cost: actualCost,
          difference: costDifference,
          needs_approval: needsAdditionalPayment,
          status: needsAdditionalPayment ? 'pending_approval' : 'verified',
          notes: notes,
          receipt_images: receiptImages.map(img => img.url),
          submitted_by: user.id
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Update the request status if needed
      if (!needsAdditionalPayment) {
        const { error: requestError } = await supabase
          .from('requests')
          .update({ 
            shipping_verified: true,
            shipping_cost: actualCost
          })
          .eq('id', requestId);
          
        if (requestError) {
          console.error('Error updating request:', requestError);
        }
      }
      
      setSuccess(true);
      if (onSubmitSuccess) {
        onSubmitSuccess(data);
      }
      
    } catch (err) {
      console.error('Error submitting shipping verification:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-6">
            <div className="rounded-full bg-green-100 p-3 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Shipping Verification Submitted</h3>
            <p className="text-gray-600 text-center mb-4">
              {needsAdditionalPayment 
                ? 'Your request for additional shipping payment is pending customer approval.'
                : 'Shipping cost has been verified successfully.'}
            </p>
            {needsAdditionalPayment && (
              <div className="w-full p-4 bg-blue-50 rounded-md text-blue-800 text-sm">
                <p>
                  The customer will be notified to approve the additional shipping cost of 
                  <span className="font-semibold"> ¥{costDifference.toLocaleString()}</span>.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="bg-blue-50 border-b">
        <CardTitle className="flex items-center">
          <Upload className="mr-2 h-5 w-5" />
          Shipping Cost Verification
        </CardTitle>
        <CardDescription>
          Submit the actual shipping cost with receipt evidence
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Estimated vs Actual Cost */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="estimated-cost">Estimated Shipping Cost</Label>
                <Input
                  id="estimated-cost"
                  value={`¥${estimatedShippingCost.toLocaleString()}`}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div>
                <Label htmlFor="actual-cost">Actual Shipping Cost (¥)</Label>
                <Input
                  id="actual-cost"
                  type="number"
                  value={actualCost}
                  onChange={(e) => setActualCost(parseInt(e.target.value) || 0)}
                  min="0"
                  required
                />
              </div>
            </div>
            
            {/* Cost Difference Alert */}
            {costDifference !== 0 && (
              <div className={`p-4 rounded-md ${needsAdditionalPayment ? 'bg-yellow-50 text-yellow-800' : 'bg-green-50 text-green-800'}`}>
                {needsAdditionalPayment ? (
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Additional Payment Required</p>
                      <p className="text-sm">
                        The actual shipping cost is <span className="font-semibold">¥{costDifference.toLocaleString()}</span> more than the 
                        estimated cost. The customer will need to approve this additional amount.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Shipping Cost Savings</p>
                      <p className="text-sm">
                        The actual shipping cost is <span className="font-semibold">¥{Math.abs(costDifference).toLocaleString()}</span> less than 
                        the estimated cost. The difference will be refunded to the customer.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Provide any details about the shipping method, tracking information, or reasons for cost differences..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
            
            {/* Receipt Upload */}
            <div className="space-y-2">
              <Label className="block mb-2">Upload Shipping Receipt</Label>
              
              <div className="border-2 border-dashed rounded-md p-6 flex flex-col items-center cursor-pointer hover:bg-gray-50 transition-colors"
                   onClick={() => fileInputRef.current?.click()}>
                <ImageIcon className="h-10 w-10 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-1">Click to upload shipping receipt</p>
                <p className="text-xs text-gray-500">PNG, JPG or PDF (Max 5MB)</p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/png,image/jpeg,image/jpg,application/pdf"
                  multiple
                  disabled={uploading}
                />
              </div>
              
              {/* Upload progress indicator */}
              {uploading && (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-500 mr-2" />
                  <span className="text-sm text-gray-600">Uploading...</span>
                </div>
              )}
              
              {/* Image previews */}
              {imagePreview.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                  {imagePreview.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Receipt ${index + 1}`}
                        className="w-full h-32 object-cover rounded-md border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-black bg-opacity-60 rounded-full p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Error message */}
            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-md flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
          
          <div className="mt-6 flex justify-end">
            <Button type="submit" disabled={submitting || uploading}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Verify Shipping Cost'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}