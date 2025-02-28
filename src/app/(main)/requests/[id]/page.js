'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, MapPin, Send, User, Star, CheckCircle, ShieldCheck } from 'lucide-react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import CheckoutForm from '@/components/payments/CheckoutForm';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function RequestDetailPage({ params }) {
    const unwrappedParams = use(params);
    const requestId = unwrappedParams.id;

    const [user, setUser] = useState(null);
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isCustomer, setIsCustomer] = useState(false);
    const [isShopper, setIsShopper] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [proposals, setProposals] = useState([]);
    const [proposalMessage, setProposalMessage] = useState('');
    const [showProposalForm, setShowProposalForm] = useState(false);
    const [loadingProposals, setLoadingProposals] = useState(false);
    const [shopperName, setShopperName] = useState(null);
    const [messageText, setMessageText] = useState('');
    const [messages, setMessages] = useState([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const fetchRequest = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    router.push('/login');
                    return;
                }

                setUser(user);

                const { data, error } = await supabase
                    .from('requests')
                    .select('*')
                    .eq('id', requestId)
                    .single();

                if (error) throw error;
                if (!data) throw new Error('Request not found');

                setRequest(data);

                // Check if user is the customer or shopper for this request
                setIsCustomer(user.id === data.customer_id);

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*, shopper_profiles(*)')
                    .eq('user_id', user.id)
                    .single();

                setIsShopper(
                    profile?.is_shopper &&
                    profile?.shopper_profiles?.id === data.shopper_id
                );

                // If the request has a shopper assigned, get their name
                if (data.shopper_id) {
                    // Get the shopper profile to find the user_id
                    const { data: shopperProfile, error: shopperProfileError } = await supabase
                        .from('shopper_profiles')
                        .select('user_id')
                        .eq('id', data.shopper_id)
                        .single();

                    if (!shopperProfileError && shopperProfile) {
                        // Get the shopper's name from their profile
                        const { data: shopperUserProfile, error: shopperUserError } = await supabase
                            .from('profiles')
                            .select('full_name, username')
                            .eq('user_id', shopperProfile.user_id)
                            .single();

                        if (!shopperUserError && shopperUserProfile) {
                            setShopperName(shopperUserProfile.full_name || shopperUserProfile.username);
                        }
                    }
                }

            } catch (err) {
                console.error('Error fetching request:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchRequest();
    }, [requestId, router]);

    // Fetch proposals
    useEffect(() => {
        const fetchProposals = async () => {
            if (!requestId || !user) return;

            setLoadingProposals(true);
            try {
                // Get proposals for this request
                let query = supabase
                    .from('request_proposals')
                    .select(`
            *,
            shopper_profiles:shopper_id(
              id, 
              user_id, 
              location, 
              rating,
              verification_level
            )
          `)
                    .eq('request_id', requestId);

                const { data, error } = await query;

                if (error) throw error;

                // Get shopper names by fetching profiles for each shopper_profile's user_id
                if (data && data.length > 0) {
                    // Extract user_ids from shopper_profiles
                    const userIds = data.map(proposal => proposal.shopper_profiles.user_id);

                    // Fetch profiles for these user_ids
                    const { data: profilesData, error: profilesError } = await supabase
                        .from('profiles')
                        .select('user_id, username, full_name')
                        .in('user_id', userIds);

                    if (profilesError) throw profilesError;

                    // Merge shopper names into proposals
                    const enhancedProposals = data.map(proposal => {
                        const shopperProfile = profilesData.find(
                            profile => profile.user_id === proposal.shopper_profiles.user_id
                        );

                        return {
                            ...proposal,
                            shopper_name: shopperProfile ? (shopperProfile.full_name || shopperProfile.username) : 'Unknown Shopper',
                            location: proposal.shopper_profiles.location || 'Not specified',
                            rating: proposal.shopper_profiles.rating || 'No ratings',
                            verification: proposal.shopper_profiles.verification_level || 'pending'
                        };
                    });

                    setProposals(enhancedProposals);
                } else {
                    setProposals([]);
                }
            } catch (err) {
                console.error('Error fetching proposals:', err);
            } finally {
                setLoadingProposals(false);
            }
        };

        if (request && request.status === 'open') {
            fetchProposals();
        }
    }, [requestId, user, request]);

    // Fetch messages
    useEffect(() => {
        const fetchMessages = async () => {
            if (!requestId || !user || !(isCustomer || isShopper)) return;

            setLoadingMessages(true);
            try {
                console.log('Fetching messages for request:', requestId);

                // First, fetch the messages themselves
                const { data: messagesData, error: messagesError } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('request_id', requestId)
                    .order('created_at', { ascending: true });

                if (messagesError) throw messagesError;

                if (!messagesData || messagesData.length === 0) {
                    setMessages([]);
                    return;
                }

                // Then, fetch profiles for all senders in a separate query
                const senderIds = [...new Set(messagesData.map(msg => msg.sender_id))];

                const { data: profilesData, error: profilesError } = await supabase
                    .from('profiles')
                    .select('user_id, username, full_name')
                    .in('user_id', senderIds);

                if (profilesError) throw profilesError;

                // Merge the data manually
                const enrichedMessages = messagesData.map(message => {
                    const senderProfile = profilesData?.find(p => p.user_id === message.sender_id);
                    return {
                        ...message,
                        sender: senderProfile || { username: 'Unknown User', full_name: null }
                    };
                });

                console.log('Enriched messages:', enrichedMessages);
                setMessages(enrichedMessages);

                // Mark messages as read
                const unreadMessages = messagesData
                    .filter(msg => msg.sender_id !== user.id && !msg.is_read)
                    .map(msg => msg.id);

                if (unreadMessages.length > 0) {
                    await supabase
                        .from('messages')
                        .update({ is_read: true })
                        .in('id', unreadMessages);
                }
            } catch (err) {
                console.error('Error in message fetching:', err);
            } finally {
                setLoadingMessages(false);
            }
        };

        if (request) {
            fetchMessages();

            // Set up real-time subscription with better error handling
            const channel = supabase
                .channel(`messages-${requestId}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `request_id=eq.${requestId}`
                }, (payload) => {
                    console.log('New message received:', payload);
                    fetchMessages(); // Refetch all messages
                })
                .subscribe((status) => {
                    console.log('Subscription status:', status);
                });

            return () => {
                console.log('Unsubscribing from messages channel');
                channel.unsubscribe();
            };
        }
        // In fetchMessages
        console.log('About to fetch messages as:', {
            isCustomer,
            isShopper,
            userId: user?.id
        });
    }, [requestId, user, request]);

    const handleCancelRequest = async () => {
        if (!confirm('Are you sure you want to cancel this request?')) return;

        setActionLoading(true);
        try {
            const { error } = await supabase
                .from('requests')
                .update({ status: 'cancelled' })
                .eq('id', requestId);

            if (error) throw error;

            // Update local state
            setRequest(prev => ({ ...prev, status: 'cancelled' }));
        } catch (err) {
            console.error('Error cancelling request:', err);
            alert('Failed to cancel request. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    // For shoppers to send proposals
    const handleSendProposal = async (e) => {
        e.preventDefault();
        setActionLoading(true);

        try {
            // Get shopper profile id - but expect MULTIPLE profiles
            const { data: shopperProfiles, error: profileError } = await supabase
                .from('shopper_profiles')
                .select('id')
                .eq('user_id', user.id);

            if (profileError) {
                console.error('Error fetching shopper profiles:', profileError);
                throw new Error(`Failed to get shopper profiles: ${profileError.message || 'Unknown error'}`);
            }

            if (!shopperProfiles || shopperProfiles.length === 0) {
                throw new Error('No shopper profile found. Please set up your shopper profile first.');
            }

            console.log('Found multiple shopper profiles:', shopperProfiles);

            // Use the first shopper profile (or implement logic to choose the right one)
            const shopperProfileId = shopperProfiles[0].id;

            console.log('Using shopper profile ID:', shopperProfileId);

            // Check if shopper already sent a proposal
            const { data: existingProposals, error: checkError } = await supabase
                .from('request_proposals')
                .select('id')
                .eq('request_id', requestId)
                .eq('shopper_id', shopperProfileId);

            if (checkError) {
                console.error('Error checking existing proposals:', checkError);
                throw new Error(`Failed to check existing proposals: ${checkError.message || 'Unknown error'}`);
            }

            if (existingProposals && existingProposals.length > 0) {
                alert('You have already sent a proposal for this request');
                setShowProposalForm(false);
                return;
            }

            // Create a proposal
            const { data: newProposal, error } = await supabase
                .from('request_proposals')
                .insert({
                    request_id: requestId,
                    shopper_id: shopperProfileId,
                    customer_message: proposalMessage || "I'm interested in helping you find this item!",
                    status: 'pending'
                })
                .select();

            if (error) {
                console.error('Error inserting proposal:', error);
                throw new Error(`Failed to create proposal: ${error.message || 'Unknown error'}`);
            }

            console.log('Created proposal:', newProposal);

            // Show success message
            alert("Your proposal has been sent to the customer!");
            setShowProposalForm(false);
            setProposalMessage('');

            // Refresh proposals (optional)
            const { data, error: refreshError } = await supabase
                .from('request_proposals')
                .select('*')
                .eq('request_id', requestId);

            if (refreshError) {
                console.error('Error refreshing proposals:', refreshError);
            } else if (data) {
                setProposals([...data]);
            }

        } catch (err) {
            console.error('Error sending proposal:', err.message, err);
            alert(`Failed to send proposal: ${err.message || 'Unknown error'}`);
        } finally {
            setActionLoading(false);
        }
    };

    // For customers to accept proposals
    const handleAcceptProposal = async (proposalId) => {
        if (!confirm('Are you sure you want to accept this proposal? Other proposals will be declined.')) return;

        setActionLoading(true);
        try {
            // Get the proposal details
            const { data: proposal, error: proposalError } = await supabase
                .from('request_proposals')
                .select('shopper_id')
                .eq('id', proposalId)
                .single();

            if (proposalError) throw proposalError;

            // Start a transaction:
            // 1. Update the proposal status to 'accepted'
            const { error: updateProposalError } = await supabase
                .from('request_proposals')
                .update({ status: 'accepted' })
                .eq('id', proposalId);

            if (updateProposalError) throw updateProposalError;

            // 2. Decline all other proposals for this request
            const { error: declineError } = await supabase
                .from('request_proposals')
                .update({ status: 'declined' })
                .eq('request_id', requestId)
                .neq('id', proposalId);

            if (declineError) throw declineError;

            // 3. Update the request status to 'assigned' and set the shopper_id
            const { error: requestError } = await supabase
                .from('requests')
                .update({
                    status: 'assigned',
                    shopper_id: proposal.shopper_id
                })
                .eq('id', requestId);

            if (requestError) throw requestError;

            // In handleAcceptProposal function in request detail page
            console.log("DEBUGGING PROPOSAL ACCEPTANCE:");
            console.log("Proposal being accepted:", proposal);
            console.log("Shopper_id from proposal:", proposal.shopper_id);
            console.log("Shopper profile data:", await supabase.from('shopper_profiles').select('*').eq('id', proposal.shopper_id).single());

            // After the request update
            const { data: updatedRequest } = await supabase
                .from('requests')
                .select('*')
                .eq('id', requestId)
                .single();

            console.log("Updated request after acceptance:", updatedRequest);

            setRequest(updatedRequest);
            alert('Proposal accepted! The shopper has been assigned to your request.');

        } catch (err) {
            console.error('Error accepting proposal:', err);
            alert('Failed to accept proposal. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    // For customers to decline proposals
    const handleDeclineProposal = async (proposalId) => {
        if (!confirm('Are you sure you want to decline this proposal?')) return;

        setActionLoading(true);
        try {
            const { error } = await supabase
                .from('request_proposals')
                .update({ status: 'declined' })
                .eq('id', proposalId);

            if (error) throw error;

            // Refresh proposals
            const { data, error: refreshError } = await supabase
                .from('request_proposals')
                .select('*')
                .eq('request_id', requestId)
                .eq('status', 'pending');

            if (!refreshError) {
                // Update the list - in a real app you'd do a complete refresh
                setProposals(proposals.filter(p => p.id !== proposalId));
            }

            alert('Proposal declined.');

        } catch (err) {
            console.error('Error declining proposal:', err);
            alert('Failed to decline proposal. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateStatus = async (newStatus) => {
        if (!confirm(`Are you sure you want to mark this request as ${newStatus}?`)) return;

        setActionLoading(true);
        try {
            const { error } = await supabase
                .from('requests')
                .update({ status: newStatus })
                .eq('id', requestId);

            if (error) throw error;

            // Update local state
            setRequest(prev => ({
                ...prev,
                status: newStatus
            }));

        } catch (err) {
            console.error(`Error updating request status to ${newStatus}:`, err);
            alert('Failed to update request status. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!messageText.trim()) return;

        try {
            const newMessage = {
                request_id: requestId,
                sender_id: user.id,
                content: messageText.trim(),
                is_read: false,
                created_at: new Date().toISOString() // Add timestamp explicitly
            };

            console.log('Sending message:', newMessage);

            const { data, error } = await supabase
                .from('messages')
                .insert([newMessage])
                .select();

            if (error) {
                console.error('Database error when saving message:', error);
                throw error;
            }

            console.log('Message saved successfully:', data);

            // Clear the input
            setMessageText('');

            // Update UI with the actual saved message
            if (data && data[0]) {
                // Add the sender info manually
                setMessages([...messages, {
                    ...data[0],
                    sender: {
                        username: 'You',
                        full_name: 'You'
                    }
                }]);
            }
        } catch (err) {
            console.error('Error sending message:', err);
            alert('Failed to send message: ' + (err.message || 'Unknown error'));
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <span className="ml-2">Loading request details...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                <Card className="bg-red-50 border-red-200">
                    <CardContent className="pt-6">
                        <h2 className="text-lg font-medium text-red-700 mb-2">Error Loading Request</h2>
                        <p className="text-red-600 mb-4">{error}</p>
                        <Button onClick={() => router.push('/requests')}>
                            Back to Requests
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
            <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <Button variant="outline" onClick={() => router.back()} className="w-full sm:w-auto">
                    ← Back to Requests
                </Button>

                <div className="flex gap-2">
                    {isCustomer && request.status === 'open' && (
                        <Button
                            variant="outline"
                            className="text-red-500 border-red-300 hover:bg-red-50"
                            onClick={handleCancelRequest}
                            disabled={actionLoading}
                        >
                            {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Cancel Request
                        </Button>
                    )}

                    {!isCustomer && !isShopper && request.status === 'open' && (
                        <Button
                            onClick={() => setShowProposalForm(true)}
                            disabled={actionLoading}
                        >
                            {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Send Proposal
                        </Button>
                    )}

                    {/* Payment button for customers when request is assigned */}
                    {isCustomer && request.status === 'assigned' && (
                        <Button
                            onClick={() => setShowPayment(true)}
                            className="bg-green-600 hover:bg-green-700"
                            disabled={actionLoading}
                        >
                            {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Make Payment
                        </Button>
                    )}

                    {isShopper && request.status === 'assigned' && (
                        <>
                            <Button
                                onClick={() => handleUpdateStatus('purchased')}
                                disabled={actionLoading}
                                variant="outline"
                            >
                                {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Mark as Purchased
                            </Button>
                        </>
                    )}

                    {isShopper && request.status === 'purchased' && (
                        <Button
                            onClick={() => handleUpdateStatus('shipped')}
                            disabled={actionLoading}
                            variant="outline"
                        >
                            {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Mark as Shipped
                        </Button>
                    )}

                    {isCustomer && request.status === 'shipped' && (
                        <Button
                            onClick={() => handleUpdateStatus('completed')}
                            disabled={actionLoading}
                        >
                            {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Confirm Receipt
                        </Button>
                    )}
                </div>
            </div>

            <Card className="mb-6 overflow-hidden">
                <CardHeader className="bg-gray-50 border-b">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                        <div>
                            <CardTitle className="text-2xl">{request.title}</CardTitle>
                            <div className="mt-2">
                                <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full capitalize 
                  ${request.status === 'open' ? 'bg-green-100 text-green-800' :
                                        request.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                            request.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                                                request.status === 'paid' ? 'bg-purple-100 text-purple-800' :
                                                    request.status === 'purchased' ? 'bg-yellow-100 text-yellow-800' :
                                                        request.status === 'shipped' ? 'bg-indigo-100 text-indigo-800' :
                                                            request.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                                'bg-gray-100 text-gray-800'}`}
                                >
                                    {request.status}
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-lg font-semibold">
                                {request.budget ? `¥${request.budget.toLocaleString()}` : 'Flexible budget'}
                            </div>
                            <div className="text-sm text-gray-500">
                                Created: {new Date(request.created_at).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="mb-6">
                        <h3 className="text-lg font-medium mb-2">Description</h3>
                        <p className="whitespace-pre-wrap text-gray-700">{request.description}</p>
                    </div>

                    {request.images && request.images.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-lg font-medium mb-2">Reference Images</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {request.images.map((url, index) => (
                                    <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="block">
                                        <img
                                            src={url}
                                            alt={`Reference ${index + 1}`}
                                            className="w-full h-48 object-cover rounded-md hover:opacity-90 transition-opacity border border-gray-200"
                                        />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-4 pt-4 border-t">
                        <h3 className="text-lg font-medium mb-2">Request Status</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-700">Current Status:</span>
                                <span className="font-medium capitalize">{request.status}</span>
                            </div>

                            {request.shopper_id ? (
                                <div className="flex justify-between">
                                    <span className="text-gray-700">Assigned Shopper:</span>
                                    <span className="font-medium">{shopperName || 'Loading...'}</span>
                                </div>
                            ) : (
                                <div className="flex justify-between">
                                    <span className="text-gray-700">Assigned Shopper:</span>
                                    <span className="text-gray-500">None yet</span>
                                </div>
                            )}

                            <div className="mt-4">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Status Timeline</h4>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${request.status === 'open' || request.status === 'assigned' || request.status === 'paid' || request.status === 'purchased' || request.status === 'shipped' || request.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                        <span className={`text-sm ${request.status === 'open' ? 'font-medium' : ''}`}>Open</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${request.status === 'assigned' || request.status === 'paid' || request.status === 'purchased' || request.status === 'shipped' || request.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                        <span className={`text-sm ${request.status === 'assigned' ? 'font-medium' : ''}`}>Assigned</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${request.status === 'paid' || request.status === 'purchased' || request.status === 'shipped' || request.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                        <span className={`text-sm ${request.status === 'paid' ? 'font-medium' : ''}`}>Paid</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${request.status === 'purchased' || request.status === 'shipped' || request.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                        <span className={`text-sm ${request.status === 'purchased' ? 'font-medium' : ''}`}>Purchased</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${request.status === 'shipped' || request.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                        <span className={`text-sm ${request.status === 'shipped' ? 'font-medium' : ''}`}>Shipped</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${request.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                        <span className={`text-sm ${request.status === 'completed' ? 'font-medium' : ''}`}>Completed</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Payment form that appears when "Make Payment" is clicked */}
            {showPayment && (
                <div className="mb-6">
                    <Elements stripe={stripePromise}>
                        <CheckoutForm
                            requestId={requestId}
                            amount={request.budget}
                            onSuccess={() => {
                                setShowPayment(false);
                                // Update request status to paid
                                handleUpdateStatus('paid');
                            }}
                        />
                    </Elements>
                </div>
            )}

            {/* Shopper Proposals Section - only visible to customers with open requests */}
            {isCustomer && request.status === 'open' && (
                <Card className="mb-6">
                    <CardHeader className="bg-gray-50 border-b">
                        <CardTitle>Shopper Proposals</CardTitle>
                        <CardDescription>
                            Shoppers who are interested in helping you
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {loadingProposals ? (
                            <div className="flex items-center justify-center h-24">
                                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                                <span className="ml-2">Loading proposals...</span>
                            </div>
                        ) : proposals.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <p className="mb-2">No proposals yet</p>
                                <p className="text-sm">Shoppers will send proposals when they're interested in your request</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {proposals.map(proposal => (
                                    <div key={proposal.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center">
                                                <div className="bg-gray-100 rounded-full p-2 mr-3">
                                                    <User className="w-5 h-5 text-gray-600" />
                                                </div>
                                                <div>
                                                    <h4 className="font-medium">{proposal.shopper_name}</h4>
                                                    <div className="flex items-center text-sm text-gray-500 mt-1">
                                                        <MapPin className="w-4 h-4 mr-1" />
                                                        {proposal.location}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex items-center">
                                                    <Star className="w-4 h-4 text-yellow-500 mr-1" />
                                                    <span className="text-sm">{proposal.rating}</span>
                                                </div>
                                                <div className="flex items-center mt-1">
                                                    <ShieldCheck className="w-4 h-4 text-blue-500 mr-1" />
                                                    <span className="text-xs capitalize">{proposal.verification}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 p-3 rounded-md mb-4">
                                            <p className="text-sm text-gray-700">{proposal.customer_message}</p>
                                        </div>

                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                onClick={() => handleDeclineProposal(proposal.id)}
                                                disabled={proposal.status !== 'pending'}
                                                className="text-sm"
                                            >
                                                Decline
                                            </Button>
                                            <Button
                                                onClick={() => handleAcceptProposal(proposal.id)}
                                                disabled={proposal.status !== 'pending'}
                                                className="text-sm"
                                            >
                                                Accept
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Proposal Form - only visible to shoppers for open requests */}
            {showProposalForm && !isCustomer && !isShopper && request.status === 'open' && (
                <Card className="mb-6">
                    <CardHeader className="bg-gray-50 border-b">
                        <CardTitle>Send Proposal</CardTitle>
                        <CardDescription>
                            Let the customer know why you're the right shopper for this request
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSendProposal}>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="proposal-message">Message to Customer</Label>
                                    <Textarea
                                        id="proposal-message"
                                        value={proposalMessage}
                                        onChange={(e) => setProposalMessage(e.target.value)}
                                        placeholder="Introduce yourself and explain why you're a good fit for this request. Mention your experience with similar items, your location in Japan, etc."
                                        rows={5}
                                        className="mt-1"
                                    />
                                </div>

                                <div className="flex justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowProposalForm(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={actionLoading}>
                                        {actionLoading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            'Send Proposal'
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Messaging section - only visible when request is assigned or further along */}
            {(isCustomer || isShopper) && request.status !== 'open' && request.status !== 'cancelled' && (
                <Card>
                    <CardHeader className="bg-gray-50 border-b">
                        <CardTitle>Messages</CardTitle>
                        <CardDescription>
                            Communication about this request
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="py-6">
                        {loadingMessages ? (
                            <div className="flex items-center justify-center h-24">
                                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                                <span className="ml-2">Loading messages...</span>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <p className="mb-2">No messages yet</p>
                                <p className="text-sm">Start the conversation with your shopper/customer</p>
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-96 overflow-y-auto mb-4 p-2">
                                {messages.map((message, index) => (
                                    <div
                                        key={message.id || `msg-${index}`} // Add a unique key using ID or index as fallback
                                        className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-xs sm:max-w-md rounded-lg px-4 py-2 ${message.sender_id === user.id
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-gray-100 text-gray-800'
                                                }`}
                                        >
                                            <div className="text-xs mb-1">
                                                {message.sender_id === user.id ? 'You' : (message.sender?.full_name || message.sender?.username || 'User')}
                                            </div>
                                            <p className="text-sm">{message.content}</p>
                                            <div className="text-xs text-right mt-1 opacity-70">
                                                {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <form onSubmit={handleSendMessage} className="mt-4">
                            <div className="flex gap-2">
                                <Input
                                    value={messageText}
                                    onChange={(e) => setMessageText(e.target.value)}
                                    placeholder="Type your message..."
                                    disabled={request.status === 'completed'}
                                />
                                <Button
                                    type="submit"
                                    disabled={!messageText.trim() || request.status === 'completed'}
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}