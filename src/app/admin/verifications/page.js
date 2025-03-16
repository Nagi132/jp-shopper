'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { 
  Zoom, Check, X, AlertTriangle, Search, ArrowLeft, ArrowRight, 
  Download, Flag, ExternalLink, Eye, ThumbsUp, ThumbsDown, Plus, Minus, Loader2
} from 'lucide-react';

export default function VerificationsAdminPage() {
  const router = useRouter();
  
  // Keep all hooks at the top level - no conditional hook calls
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [verifications, setVerifications] = useState([]);
  const [currentVerification, setCurrentVerification] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [flagged, setFlagged] = useState(false);
  const [notes, setNotes] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [shopperNames, setShopperNames] = useState({});
  const [processingAction, setProcessingAction] = useState(false);
  
  // Fetch verifications (always declare this function, even if not called)
  const fetchVerifications = async () => {
    try {
      const { data, error } = await supabase
        .from('shipping_verifications')
        .select(`
          *,
          requests(
            id,
            title,
            status,
            shopper_id
          )
        `)
        .in('status', ['pending', 'pending_approval'])
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        setVerifications(data);
        
        // Get all unique shopper IDs
        const shopperIds = [...new Set(data.map(v => v.requests?.shopper_id).filter(Boolean))];
        
        // Get shopper profiles
        if (shopperIds.length > 0) {
          const { data: shopperProfiles } = await supabase
            .from('shopper_profiles')
            .select('id, user_id')
            .in('id', shopperIds);
            
          if (shopperProfiles && shopperProfiles.length > 0) {
            // Get user profiles for these shopper profiles
            const userIds = shopperProfiles.map(sp => sp.user_id).filter(Boolean);
            
            if (userIds.length > 0) {
              const { data: userProfiles } = await supabase
                .from('profiles')
                .select('user_id, username, full_name')
                .in('user_id', userIds);
                
              if (userProfiles) {
                // Create a mapping of shopper_id to name
                const nameMap = {};
                
                shopperProfiles.forEach(sp => {
                  const userProfile = userProfiles.find(up => up.user_id === sp.user_id);
                  if (userProfile) {
                    nameMap[sp.id] = userProfile.full_name || userProfile.username || 'Unknown';
                  }
                });
                
                setShopperNames(nameMap);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Error fetching verifications:', err);
    }
  };
  
  // Check if the user is an admin
  useEffect(() => {
    async function checkAuthAndLoadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          // Instead of redirecting immediately, set flags
          setAuthChecked(true);
          setUser(null);
          setLoading(false);
          return;
        }
        
        setUser(user);
        
        // Check if user is an admin (you can implement your own admin check)
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('user_id', user.id)
          .single();
          
        // Set admin flag
        const userIsAdmin = profile?.is_admin === true;
        setIsAdmin(userIsAdmin);
        
        // Only fetch data if user is admin
        if (userIsAdmin) {
          await fetchVerifications();
        }
        
        // Mark auth check as complete
        setAuthChecked(true);
        setLoading(false);
      } catch (error) {
        console.error('Error checking authentication:', error);
        setAuthChecked(true);
        setLoading(false);
      }
    }
    
    checkAuthAndLoadData();
  }, []);

  // Only redirect after component is mounted and auth is checked
  useEffect(() => {
    if (authChecked && !loading) {
      if (!user) {
        router.push('/login?redirect=/admin/verifications');
      } else if (!isAdmin) {
        alert('You do not have permission to access this page');
        router.push('/dashboard');
      }
    }
  }, [authChecked, loading, user, isAdmin, router]);
  
  const getShopperName = (shopperId) => {
    return shopperNames[shopperId] || 'Unknown Shopper';
  };
  
  const handleApprove = async () => {
    if (!verifications[currentVerification]) return;
    
    const verification = verifications[currentVerification];
    setProcessingAction(true);
    
    try {
      // Update verification status
      const { error: verificationError } = await supabase
        .from('shipping_verifications')
        .update({
          status: 'approved',
          admin_notes: notes,
          flagged: flagged,
          approval_date: new Date().toISOString(),
          approved_by: user.id
        })
        .eq('id', verification.id);
        
      if (verificationError) throw verificationError;
      
      // Update request with verified shipping cost
      const { error: requestError } = await supabase
        .from('requests')
        .update({
          shipping_verified: true,
          shipping_cost: verification.actual_cost,
          status: verification.requests?.status === 'purchased' ? 'shipped' : verification.requests?.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', verification.request_id);
        
      if (requestError) throw requestError;
      
      // Remove this verification from the list
      setVerifications(current => 
        current.filter(v => v.id !== verification.id)
      );
      
      // Move to next verification or reset index
      if (currentVerification >= verifications.length - 1) {
        setCurrentVerification(Math.max(0, verifications.length - 2));
      }
      
      // Reset UI state
      setNotes('');
      setFlagged(false);
      alert('Verification approved successfully');
      
    } catch (error) {
      console.error('Error approving verification:', error);
      alert(`Error approving verification: ${error.message}`);
    } finally {
      setProcessingAction(false);
    }
  };
  
  const handleReject = async () => {
    if (!verifications[currentVerification]) return;
    if (!notes) {
      alert('Please provide rejection reason in the notes');
      return;
    }
    
    const verification = verifications[currentVerification];
    setProcessingAction(true);
    
    try {
      // Update verification status
      const { error: verificationError } = await supabase
        .from('shipping_verifications')
        .update({
          status: 'rejected',
          admin_notes: notes,
          flagged: flagged,
          rejection_date: new Date().toISOString(),
          rejected_by: user.id
        })
        .eq('id', verification.id);
        
      if (verificationError) throw verificationError;
      
      // Remove this verification from the list
      setVerifications(current => 
        current.filter(v => v.id !== verification.id)
      );
      
      // Move to next verification or reset index
      if (currentVerification >= verifications.length - 1) {
        setCurrentVerification(Math.max(0, verifications.length - 2));
      }
      
      // Reset UI state
      setNotes('');
      setFlagged(false);
      alert('Verification rejected successfully');
      
    } catch (error) {
      console.error('Error rejecting verification:', error);
      alert(`Error rejecting verification: ${error.message}`);
    } finally {
      setProcessingAction(false);
    }
  };
  
  const handleShowImage = (index) => {
    setCurrentImage(index);
    setShowImageModal(true);
  };

  const handleNextVerification = () => {
    if (currentVerification < verifications.length - 1) {
      setCurrentVerification(currentVerification + 1);
      setFlagged(false);
      setNotes('');
      setZoomLevel(1);
    }
  };

  const handlePreviousVerification = () => {
    if (currentVerification > 0) {
      setCurrentVerification(currentVerification - 1);
      setFlagged(false);
      setNotes('');
      setZoomLevel(1);
    }
  };
  
  const handleZoomIn = () => {
    setZoomLevel(Math.min(zoomLevel + 0.25, 3));
  };
  
  const handleZoomOut = () => {
    setZoomLevel(Math.max(zoomLevel - 0.25, 0.5));
  };
  
  // Always render a complete component, use conditional rendering inside
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2">Loading verification data...</span>
      </div>
    );
  }
  
  // Don't render the admin UI for non-admin users, but still render something
  if (authChecked && (!user || !isAdmin)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-6 bg-red-50 rounded-lg max-w-md">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-800 mb-4">Access Denied</h2>
          <p className="mb-4">You need admin privileges to view this page.</p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  if (authChecked && isAdmin && verifications.length === 0) {
    return (
      <div className="bg-gray-50 min-h-screen p-6">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-8 text-center">
          <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">No Pending Verifications</h2>
          <p className="text-gray-600 mb-6">There are no shipping verifications pending approval at this time.</p>
          <button 
            onClick={() => router.push('/admin')}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Return to Admin Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  // Only proceed if we have verifications
  if (!verifications.length || !verifications[currentVerification]) {
    return (
      <div className="bg-gray-50 min-h-screen p-6">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-8 text-center">
          <Loader2 className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
          <h2 className="text-2xl font-bold mb-4">Loading Verification Data</h2>
          <p className="text-gray-600">Please wait while we load the verification details...</p>
        </div>
      </div>
    );
  }
  
  const verification = verifications[currentVerification];
  const shopperId = verification?.requests?.shopper_id;
  const shopperName = getShopperName(shopperId);
  
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b shadow-sm p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Shipping Receipt Verification</h1>
          <div className="flex items-center space-x-2">
            <button 
              className="px-3 py-1.5 text-sm bg-gray-100 rounded-md flex items-center hover:bg-gray-200"
              onClick={handlePreviousVerification}
              disabled={currentVerification === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Previous
            </button>
            <div className="text-sm">
              {currentVerification + 1} of {verifications.length}
            </div>
            <button 
              className="px-3 py-1.5 text-sm bg-gray-100 rounded-md flex items-center hover:bg-gray-200"
              onClick={handleNextVerification}
              disabled={currentVerification === verifications.length - 1}
            >
              Next
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left column - Receipt info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium mb-4">Verification Details</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Verification ID:</span>
                  <span className="font-mono text-sm">{verification?.id || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Request ID:</span>
                  <span className="font-mono text-sm">{verification?.request_id || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Request Title:</span>
                  <span className="text-sm">{verification?.requests?.title || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Shopper:</span>
                  <span>{shopperName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Submitted:</span>
                  <span>{verification?.created_at ? new Date(verification.created_at).toLocaleString() : 'N/A'}</span>
                </div>
                <hr />
                <div className="flex justify-between font-medium">
                  <span className="text-gray-800">Estimated Cost:</span>
                  <span>¥{verification?.estimated_cost?.toLocaleString() || '0'}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-gray-800">Actual Cost:</span>
                  <span>¥{verification?.actual_cost?.toLocaleString() || '0'}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-gray-800">Difference:</span>
                  <span className={verification?.difference > 0 ? "text-red-600" : "text-green-600"}>
                    {verification?.difference > 0 ? "+" : ""}
                    ¥{verification?.difference?.toLocaleString() || '0'}
                  </span>
                </div>
                <hr />
                <div className="flex justify-between">
                  <span className="text-gray-500">Needs Customer Approval:</span>
                  <span>{verification?.needs_approval ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status:</span>
                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                    {verification?.status || 'unknown'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium mb-4">Shopper Notes</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{verification?.notes || "No notes provided"}</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium mb-4">Verification Actions</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Admin Notes</label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add verification notes or rejection reason..."
                  className="w-full rounded-md border border-gray-300 p-2 text-sm"
                  rows={3}
                ></textarea>
              </div>
              
              <div className="flex items-center mb-4">
                <input 
                  type="checkbox" 
                  id="flag" 
                  checked={flagged}
                  onChange={() => setFlagged(!flagged)}
                  className="h-4 w-4 text-red-600 rounded border-gray-300"
                />
                <label htmlFor="flag" className="ml-2 text-sm text-gray-700">
                  Flag for further investigation
                </label>
              </div>
              
              <div className="flex justify-between space-x-4">
                <button 
                  className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 py-2 px-4 rounded-md flex items-center justify-center"
                  onClick={handleReject}
                  disabled={processingAction}
                >
                  {processingAction ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <ThumbsDown className="w-4 h-4 mr-2" />
                  )}
                  Reject
                </button>
                <button 
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md flex items-center justify-center"
                  onClick={handleApprove}
                  disabled={processingAction}
                >
                  {processingAction ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <ThumbsUp className="w-4 h-4 mr-2" />
                  )}
                  Approve
                </button>
              </div>
            </div>
          </div>
          
          {/* Right column - Receipt images */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium">Receipt Images</h2>
                <div className="flex space-x-2">
                  <button 
                    className="p-1 rounded hover:bg-gray-100" 
                    onClick={handleZoomOut}
                    disabled={zoomLevel <= 0.5}
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="text-sm py-1">{Math.round(zoomLevel * 100)}%</span>
                  <button 
                    className="p-1 rounded hover:bg-gray-100" 
                    onClick={handleZoomIn}
                    disabled={zoomLevel >= 3}
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {verification?.receipt_images && verification.receipt_images.length > 0 ? (
                <div className="space-y-4">
                  {verification.receipt_images.map((image, index) => (
                    <div key={index} className="border rounded-md overflow-hidden">
                      <div className="bg-gray-100 px-3 py-2 border-b flex justify-between items-center">
                        <span className="text-sm font-medium">Receipt Image {index + 1}</span>
                        <div className="flex space-x-2">
                          <button 
                            className="p-1 rounded hover:bg-gray-200"
                            onClick={() => handleShowImage(index)}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <a 
                            href={image} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-1 rounded hover:bg-gray-200"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                      <div className="relative bg-gray-50 overflow-auto" style={{ height: "400px" }}>
                        <div className="inline-block min-w-full" style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left', transition: 'transform 0.2s' }}>
                          <img 
                            src={image} 
                            alt={`Receipt ${index + 1}`} 
                            className="max-w-full h-auto"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 bg-gray-50 rounded-md">
                  <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
                  <p className="text-gray-600">No receipt images found. This is unusual and should be investigated.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Image modal */}
      {showImageModal && verification?.receipt_images && verification.receipt_images.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full w-full bg-white rounded-lg overflow-hidden">
            <div className="sticky top-0 bg-white px-4 py-3 border-b flex justify-between items-center">
              <h3 className="text-lg font-medium">Receipt Image {currentImage + 1}</h3>
              <button 
                className="p-1 rounded-full hover:bg-gray-100"
                onClick={() => setShowImageModal(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-1 bg-gray-100 overflow-auto" style={{ maxHeight: 'calc(100vh - 100px)' }}>
              <img 
                src={verification.receipt_images[currentImage]} 
                alt={`Receipt ${currentImage + 1}`} 
                className="max-w-full h-auto mx-auto"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}