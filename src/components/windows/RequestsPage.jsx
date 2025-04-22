'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/components/layouts/ThemeProvider';
import { Plus, Loader2, CheckCircle, Clock, Package, AlertCircle } from 'lucide-react';
import { getStatusColor, getStatusIcon } from '@/lib/helpers/requestStatusHelpers';

/**
 * RequestsPage - Windows-styled component to display user's requests
 * Used in both Window and standalone contexts
 */
const RequestsPage = ({ isWindowView = true }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const router = useRouter();
  const { openWindow } = useApp();
  const { theme } = useTheme();

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
    return luminance > 0.5 ? '000000' : 'FFFFFF';
  };
  
  const textColor = theme?.textColor || getContrastText(bgColor);

  // Load requests data
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (!isWindowView) {
            router.push('/login');
          }
          return;
        }

        // Fetch requests
        const { data, error } = await supabase
          .from('requests')
          .select('*')
          .eq('customer_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setRequests(data || []);
      } catch (err) {
        console.error('Error fetching requests:', err);
        setError('Failed to load requests');
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [router, isWindowView]);

  // Filter requests based on active tab
  const filteredRequests = requests.filter(request => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return ['assigned', 'paid', 'purchased', 'shipped'].includes(request.status);
    if (activeTab === 'open') return request.status === 'open';
    if (activeTab === 'completed') return request.status === 'completed';
    return true;
  });

  // Stats for the tabs
  const stats = {
    all: requests.length,
    active: requests.filter(req => ['assigned', 'paid', 'purchased', 'shipped'].includes(req.status)).length,
    open: requests.filter(req => req.status === 'open').length,
    completed: requests.filter(req => req.status === 'completed').length
  };

  // Handle request click - in window mode, open a new window; otherwise navigate
  const handleRequestClick = (requestId) => {
    if (isWindowView) {
      openWindow(`request-${requestId}`, 'RequestDetail', `Request #${requestId}`);
    } else {
      router.push(`/requests/${requestId}`);
    }
  };

  // Handle create request
  const handleCreateRequest = () => {
    if (isWindowView) {
      openWindow('new-request', 'NewRequestPage', 'Create New Request');
    } else {
      router.push('/requests/new');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div 
          className="w-8 h-8 rounded-full animate-spin mb-3"
          style={{ 
            borderTopWidth: '3px',
            borderRightWidth: '3px',
            borderStyle: 'solid',
            borderColor: `#${borderColor}` 
          }}
        ></div>
        <span className="ml-2">Loading your requests...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-md my-6">
        <div className="flex">
          <AlertCircle className="w-5 h-5 mr-2 mt-0.5" />
          <div>
            <h3 className="font-bold">Error</h3>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header with tabs */}
      <div 
        className="py-2 px-4 flex items-center justify-between border-b"
        style={{ 
          backgroundColor: `#${bgColor}30`, 
          borderColor: `#${borderColor}40` 
        }}
      >
        <div className="flex">
          <button
            className={`px-3 py-1 text-sm font-medium border-b-2 ${
              activeTab === 'all' 
                ? `border-[#${borderColor}]` 
                : 'border-transparent hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('all')}
            style={{ color: activeTab === 'all' ? `#${borderColor}` : `#${textColor}` }}
          >
            All
            <span 
              className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-opacity-20"
              style={{ backgroundColor: `#${borderColor}30` }}
            >
              {stats.all}
            </span>
          </button>
          
          <button
            className={`px-3 py-1 text-sm font-medium border-b-2 ${
              activeTab === 'active' 
                ? `border-[#${borderColor}]` 
                : 'border-transparent hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('active')}
            style={{ color: activeTab === 'active' ? `#${borderColor}` : `#${textColor}` }}
          >
            Active
            <span 
              className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-opacity-20"
              style={{ backgroundColor: `#${borderColor}30` }}
            >
              {stats.active}
            </span>
          </button>
          
          <button
            className={`px-3 py-1 text-sm font-medium border-b-2 ${
              activeTab === 'open' 
                ? `border-[#${borderColor}]` 
                : 'border-transparent hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('open')}
            style={{ color: activeTab === 'open' ? `#${borderColor}` : `#${textColor}` }}
          >
            Open
            <span 
              className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-opacity-20"
              style={{ backgroundColor: `#${borderColor}30` }}
            >
              {stats.open}
            </span>
          </button>
          
          <button
            className={`px-3 py-1 text-sm font-medium border-b-2 ${
              activeTab === 'completed' 
                ? `border-[#${borderColor}]` 
                : 'border-transparent hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('completed')}
            style={{ color: activeTab === 'completed' ? `#${borderColor}` : `#${textColor}` }}
          >
            Completed
            <span 
              className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-opacity-20"
              style={{ backgroundColor: `#${borderColor}30` }}
            >
              {stats.completed}
            </span>
          </button>
        </div>
        
        {/* Create Request Button */}
        <button
          className="flex items-center px-3 py-1.5 text-sm rounded-sm"
          style={{ 
            backgroundColor: `#${borderColor}`,
            color: getContrastText(borderColor) === '000000' ? '#000000' : '#FFFFFF',
            border: `1px solid #${borderColor}`,
            boxShadow: '1px 1px 0 rgba(0,0,0,0.1)'
          }}
          onClick={handleCreateRequest}
        >
          <Plus className="w-4 h-4 mr-1" />
          Create Request
        </button>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-auto p-4">
        {filteredRequests.length === 0 ? (
          <div 
            className="text-center py-10 border-2 rounded-lg border-dashed"
            style={{ 
              borderColor: `#${borderColor}50`,
              backgroundColor: `#${bgColor}20` 
            }}
          >
            <div className="mb-3">
              {activeTab === 'active' && <Package className="w-12 h-12 mx-auto text-gray-400" />}
              {activeTab === 'open' && <Clock className="w-12 h-12 mx-auto text-gray-400" />}
              {activeTab === 'completed' && <CheckCircle className="w-12 h-12 mx-auto text-gray-400" />}
              {activeTab === 'all' && <Package className="w-12 h-12 mx-auto text-gray-400" />}
            </div>
            <p className="mb-4">
              {activeTab === 'active' && "You don't have any active requests."}
              {activeTab === 'open' && "You don't have any open requests."}
              {activeTab === 'completed' && "You haven't completed any requests yet."}
              {activeTab === 'all' && "You haven't created any requests yet."}
            </p>
            <button
              className="py-1.5 px-4 text-sm rounded-sm"
              style={{ 
                backgroundColor: `#${borderColor}`,
                color: getContrastText(borderColor) === '000000' ? '#000000' : '#FFFFFF',
                border: `1px solid #${borderColor}`,
                boxShadow: '1px 1px 0 rgba(0,0,0,0.1)'
              }}
              onClick={handleCreateRequest}
            >
              Create Your First Request
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map((request) => (
              <div 
                key={request.id} 
                className="p-3 border rounded-sm hover:shadow-sm cursor-pointer transition-shadow"
                style={{ 
                  backgroundColor: `#${bgColor}10`,
                  borderColor: `#${borderColor}40`,
                }}
                onClick={() => handleRequestClick(request.id)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{request.title || 'Untitled Request'}</h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {request.description || 'No description provided'}
                    </p>
                  </div>
                  <span 
                    className={`px-2 py-1 text-xs rounded-full capitalize inline-flex items-center gap-1 ${getStatusColor(request.status)}`}
                  >
                    {getStatusIcon(request.status)}
                    <span>{request.status}</span>
                  </span>
                </div>
                
                <div className="flex justify-between items-center mt-3">
                  <span className="text-sm text-gray-500">
                    Budget: {request.budget ? `¥${request.budget.toLocaleString()}` : 'Flexible'}
                  </span>
                  
                  {/* Images preview */}
                  {request.images && request.images.length > 0 && (
                    <div className="flex space-x-1">
                      {request.images.slice(0, 3).map((url, index) => (
                        <div 
                          key={index}
                          className="w-8 h-8 rounded-sm overflow-hidden border"
                          style={{ borderColor: `#${borderColor}50` }}
                        >
                          <img
                            src={url}
                            alt={`Image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                      {request.images.length > 3 && (
                        <div 
                          className="w-8 h-8 rounded-sm flex items-center justify-center text-xs"
                          style={{ 
                            backgroundColor: `#${bgColor}30`,
                            border: `1px solid #${borderColor}50` 
                          }}
                        >
                          +{request.images.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Status bar */}
      <div 
        className="h-5 text-xs px-2 flex items-center"
        style={{ 
          backgroundColor: `#${bgColor}20`,
          borderTop: `1px solid #${borderColor}40`
        }}
      >
        <span>{filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''} • {activeTab}</span>
      </div>
    </div>
  );
};

export default RequestsPage;