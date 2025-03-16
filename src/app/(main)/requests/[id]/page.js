'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Import components
import RequestHeader from '@/components/requests/RequestHeader';
import RequestDetails from '@/components/requests/RequestDetails';
import RequestActionButtons from '@/components/requests/RequestActionButtons';
import ProposalsList from '@/components/requests/ProposalsList';
import ProposalForm from '@/components/requests/ProposalForm';
import MessagingSection from '@/components/messaging/MessagingSection';
import CheckoutForm from '@/components/payments/CheckoutForm';
import RequestDebugPanel from '@/components/debug/RequestDebugPanel';

// Import shipping components
import ShippingVerification from '@/components/shipping/ShippingVerification';
import ShippingApprovalRequest from '@/components/shipping/ShippingApprovalRequest';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function RequestDetailPage({ params }) {
    const unwrappedParams = use(params);
    const requestId = unwrappedParams.id;
    const router = useRouter();

    // Core state
    const [user, setUser] = useState(null);
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isCustomer, setIsCustomer] = useState(false);
    const [isShopper, setIsShopper] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [proposals, setProposals] = useState([]);
    const [showProposalForm, setShowProposalForm] = useState(false);
    const [loadingProposals, setLoadingProposals] = useState(false);
    const [shopperName, setShopperName] = useState(null);
    const [customerName, setCustomerName] = useState(null);

    // Shipping-related state
    const [shippingVerification, setShippingVerification] = useState(null);
    const [loadingShippingVerification, setLoadingShippingVerification] = useState(false);

    // Fetch the request data and shipping verification
    useEffect(() => {
        const fetchRequestData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    router.push('/login');
                    return;
                }

                setUser(user);
                console.log('Current user ID:', user.id);

                // Fetch the request
                const { data, error } = await supabase
                    .from('requests')
                    .select('*')
                    .eq('id', requestId)
                    .single();

                if (error) throw error;
                if (!data) throw new Error('Request not found');

                console.log('REQUEST DATA:', data);
                setRequest(data);

                // Determine if the current user is the customer
                const userIsCustomer = user.id === data.customer_id;
                setIsCustomer(userIsCustomer);
                console.log('User is customer?', userIsCustomer);

                // If the request has a shopper assigned, determine if current user is the shopper
                if (data.shopper_id) {
                    console.log('Request has shopper_id:', data.shopper_id);

                    // Get the shopper profile to find the user_id
                    const { data: shopperProfile, error: shopperProfileError } = await supabase
                        .from('shopper_profiles')
                        .select('user_id')
                        .eq('id', data.shopper_id)
                        .single();

                    console.log('Shopper profile lookup result:', shopperProfile, shopperProfileError);

                    if (!shopperProfileError && shopperProfile) {
                        // Set isShopper based on direct user_id comparison
                        const userIsShopper = user.id === shopperProfile.user_id;
                        setIsShopper(userIsShopper);
                        console.log('User is shopper:', userIsShopper, 'Shopper user_id:', shopperProfile.user_id);

                        // Get the shopper's name using a simpler query
                        try {
                            // Create a function in Supabase that returns a profile by user_id
                            // You can do this via the SQL editor in Supabase
                            const { data: shopperUserProfile, error } = await supabase
                                .rpc('get_profile_by_user_id', {
                                    p_user_id: shopperProfile.user_id
                                });

                            if (error) throw error;

                            if (shopperUserProfile) {
                                setShopperName(shopperUserProfile.full_name || shopperUserProfile.username);
                                console.log('Shopper name set to:', shopperUserProfile.full_name || shopperUserProfile.username);
                            } else {
                                setShopperName('Shopper');
                            }
                        } catch (profileError) {
                            console.error('Error fetching shopper profile name:', profileError);
                            setShopperName('Shopper');
                        }
                    }
                } else {
                    console.log('Request has no shopper assigned yet');
                    setIsShopper(false);
                }

                // If current user is shopper, get customer name for messaging
                if (data.customer_id && !userIsCustomer) {
                    try {
                        const { data: customerProfile } = await supabase
                            .from('profiles')
                            .select('user_id, username, full_name')
                            .eq('user_id', data.customer_id)
                            .single();

                        if (customerProfile) {
                            setCustomerName(customerProfile.full_name || customerProfile.username);
                            console.log('Customer name set to:', customerProfile.full_name || customerProfile.username);
                        }
                    } catch (profileError) {
                        console.error('Error fetching customer profile name:', profileError);
                        setCustomerName('Customer');
                    }
                }

                // Fetch shipping verification data if request is in appropriate status
                if (['paid', 'purchased', 'shipped', 'completed'].includes(data.status)) {
                    setLoadingShippingVerification(true);
                    try {
                        const { data: verificationData, error: verificationError } = await supabase
                            .from('shipping_verifications')
                            .select('*')
                            .eq('request_id', requestId)
                            .order('created_at', { ascending: false })
                            .limit(1);

                        if (!verificationError && verificationData && verificationData.length > 0) {
                            console.log('Found shipping verification:', verificationData[0]);
                            setShippingVerification(verificationData[0]);
                        }
                    } catch (verificationErr) {
                        console.error('Error fetching shipping verification:', verificationErr);
                    } finally {
                        setLoadingShippingVerification(false);
                    }
                }

            } catch (err) {
                console.error('Error fetching request:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchRequestData();
    }, [requestId, router]);

    // Fetch proposals
    useEffect(() => {
        const fetchProposals = async () => {
            if (!requestId || !user || !request || request.status !== 'open' || !isCustomer) return;

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

        fetchProposals();
    }, [requestId, user, request, isCustomer]);

    // Actions handlers
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
    const handleSendProposal = async (message) => {
        setActionLoading(true);

        try {
            // Get shopper profile id
            const { data: shopperProfiles, error: profileError } = await supabase
                .from('shopper_profiles')
                .select('id')
                .eq('user_id', user.id);

            if (profileError) {
                throw new Error(`Failed to get shopper profiles: ${profileError.message || 'Unknown error'}`);
            }

            if (!shopperProfiles || shopperProfiles.length === 0) {
                throw new Error('No shopper profile found. Please set up your shopper profile first.');
            }

            // Use the first shopper profile
            const shopperProfileId = shopperProfiles[0].id;

            // Check if shopper already sent a proposal
            const { data: existingProposals, error: checkError } = await supabase
                .from('request_proposals')
                .select('id')
                .eq('request_id', requestId)
                .eq('shopper_id', shopperProfileId);

            if (checkError) {
                throw new Error(`Failed to check existing proposals: ${checkError.message || 'Unknown error'}`);
            }

            if (existingProposals && existingProposals.length > 0) {
                alert('You have already sent a proposal for this request');
                setShowProposalForm(false);
                return;
            }

            // Create a proposal
            const { error } = await supabase
                .from('request_proposals')
                .insert({
                    request_id: requestId,
                    shopper_id: shopperProfileId,
                    customer_message: message || "I'm interested in helping you find this item!",
                    status: 'pending'
                });

            if (error) {
                throw new Error(`Failed to create proposal: ${error.message || 'Unknown error'}`);
            }

            // Show success message
            alert("Your proposal has been sent to the customer!");
            setShowProposalForm(false);

        } catch (err) {
            console.error('Error sending proposal:', err);
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

            // 1. Update the proposal status to 'accepted'
            const { error: updateProposalError } = await supabase
                .from('request_proposals')
                .update({ status: 'accepted' })
                .eq('id', proposalId);

            if (updateProposalError) throw updateProposalError;

            // 2. Decline all other proposals for this request
            await supabase
                .from('request_proposals')
                .update({ status: 'declined' })
                .eq('request_id', requestId)
                .neq('id', proposalId);

            // 3. Update the request status to 'assigned' and set the shopper_id
            const { error: requestError } = await supabase
                .from('requests')
                .update({
                    status: 'assigned',
                    shopper_id: proposal.shopper_id
                })
                .eq('id', requestId);

            if (requestError) throw requestError;

            // Get the updated request
            const { data: updatedRequest } = await supabase
                .from('requests')
                .select('*')
                .eq('id', requestId)
                .single();

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

            // Update the list
            setProposals(proposals.filter(p => p.id !== proposalId));
            alert('Proposal declined.');

        } catch (err) {
            console.error('Error declining proposal:', err);
            alert('Failed to decline proposal. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    // Handle updating the request status
    // Improve the handleUpdateStatus function

    // Update the handleUpdateStatus function in the page.js file

    const handleUpdateStatus = async (newStatus) => {
        if (!confirm(`Are you sure you want to mark this request as ${newStatus}?`)) return;

        setActionLoading(true);
        try {
            console.log(`Attempting to update request status from ${request?.status} to ${newStatus}`);

            // Create update data object
            const updateData = {
                status: newStatus,
                updated_at: new Date().toISOString()
            };

            // Special handling for different status transitions
            if (newStatus === 'purchased' && request?.status === 'paid') {
                console.log('Transitioning from paid to purchased');
                // No special fields needed
            }
            else if (newStatus === 'shipped' && request?.status === 'purchased') {
                console.log('Transitioning from purchased to shipped');

                // If there's no shipping verification yet, validate
                if (!shippingVerification) {
                    // Check if there's a shipping deposit requirement
                    if (request?.shipping_deposit > 0) {
                        if (!confirm('No shipping verification has been submitted. Are you sure you want to proceed?')) {
                            setActionLoading(false);
                            return;
                        }
                    }
                }
                // If verification exists, apply its values
                else {
                    updateData.shipping_verified = true;
                    updateData.shipping_cost = shippingVerification.actual_cost;
                }
            }

            console.log('Sending update to database:', updateData);

            // Execute the update
            const { error } = await supabase
                .from('requests')
                .update(updateData)
                .eq('id', requestId);

            if (error) {
                console.error(`Error updating request status to ${newStatus}:`, error);
                throw new Error(`Failed to update status: ${error.message}`);
            }

            console.log('Request status updated successfully');

            // Update local state
            setRequest(prev => ({
                ...prev,
                ...updateData
            }));

            // Show success message
            alert(`Request has been marked as ${newStatus}`);

            // Force reload to ensure we see updated state
            window.location.reload();

        } catch (err) {
            console.error(`Error updating request status to ${newStatus}:`, err);
            alert(`Failed to update request status: ${err.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    // Handle shipping verification submission
    const handleShippingVerificationSubmit = async (data) => {
        setShippingVerification(data);

        // If no additional approval needed, and status is purchased, update to shipped
        if (!data.needs_approval && request.status === 'purchased') {
            try {
                console.log("Updating request status to shipped");

                // First update request as verified with shipping cost
                const { error: updateError } = await supabase
                    .from('requests')
                    .update({
                        shipping_verified: true,
                        shipping_cost: data.actual_cost,
                        status: 'shipped',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', requestId);

                if (updateError) {
                    console.error('Error updating request status:', updateError);
                    alert('There was an issue updating the request status. Please try again.');
                } else {
                    console.log("Request successfully updated to shipped status");

                    // Update local state before reload
                    setRequest(prev => ({
                        ...prev,
                        status: 'shipped',
                        shipping_verified: true,
                        shipping_cost: data.actual_cost
                    }));

                    // Don't reload immediately - let the component's own success flow handle it
                }
            } catch (err) {
                console.error('Error updating shipping verification:', err);
                // Don't show an alert here - let the component handle its own errors
            }
        }
    };

    // Handle shipping approval from customer
    const handleShippingApproval = async () => {
        try {
            setActionLoading(true);

            // Update verification status
            const { error: verificationError } = await supabase
                .from('shipping_verifications')
                .update({
                    status: 'approved',
                    approval_date: new Date().toISOString()
                })
                .eq('id', shippingVerification.id);

            if (verificationError) throw verificationError;

            // Update request
            const { error: requestError } = await supabase
                .from('requests')
                .update({
                    shipping_verified: true,
                    shipping_cost: shippingVerification.actual_cost
                })
                .eq('id', requestId);

            if (requestError) throw requestError;

            // Update local state
            setShippingVerification(prev => ({ ...prev, status: 'approved' }));
            setRequest(prev => ({
                ...prev,
                shipping_verified: true,
                shipping_cost: shippingVerification.actual_cost
            }));

            // Update to shipped status
            handleUpdateStatus('shipped');

        } catch (err) {
            console.error('Error approving shipping:', err);
            alert('Failed to approve shipping. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    // Handle shipping rejection from customer
    const handleShippingRejection = async () => {
        try {
            setActionLoading(true);

            // Update verification status
            const { error: verificationError } = await supabase
                .from('shipping_verifications')
                .update({
                    status: 'rejected',
                    rejection_date: new Date().toISOString()
                })
                .eq('id', shippingVerification.id);

            if (verificationError) throw verificationError;

            // Update local state
            setShippingVerification(prev => ({ ...prev, status: 'rejected' }));

            alert('You have rejected the additional shipping cost. Please contact the shopper to discuss alternatives.');

        } catch (err) {
            console.error('Error rejecting shipping:', err);
            alert('Failed to reject shipping. Please try again.');
        } finally {
            setActionLoading(false);
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
                        <button onClick={() => router.push('/requests')} className="px-4 py-2 bg-blue-500 text-white rounded">
                            Back to Requests
                        </button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
            <div className="mb-6 flex justify-between items-center">
                <RequestHeader
                    request={request}
                    onBack={() => router.back()}
                />

                <RequestActionButtons
                    request={request}
                    isCustomer={isCustomer}
                    isShopper={isShopper}
                    loading={actionLoading}
                    shippingVerificationActive={isShopper && request.status === 'purchased' && !request.shipping_verified}
                    onCancel={handleCancelRequest}
                    onShowPayment={() => setShowPayment(true)}
                    onUpdateStatus={handleUpdateStatus}
                    onShowProposalForm={() => setShowProposalForm(true)}
                />
            </div>

            <RequestDetails
                request={request}
                shopperName={shopperName}
                shippingVerification={shippingVerification}
                className="mb-6"
            />

            {/* Payment form that appears when "Make Payment" is clicked */}
            {showPayment && (
                <div className="mb-6">
                    <Elements stripe={stripePromise}>
                        <CheckoutForm
                            requestId={requestId}
                            amount={request.budget}
                            onSuccess={() => {
                                setShowPayment(false);
                                handleUpdateStatus('paid');
                            }}
                        />
                    </Elements>
                </div>
            )}

            {/* Shopper Proposals Section - only visible to customers with open requests */}
            {isCustomer && request.status === 'open' && (
                <ProposalsList
                    proposals={proposals}
                    loading={loadingProposals}
                    onAccept={handleAcceptProposal}
                    onDecline={handleDeclineProposal}
                    className="mb-6"
                />
            )}

            {/* Proposal Form - only visible to shoppers for open requests */}
            {showProposalForm && !isCustomer && !isShopper && request.status === 'open' && (
                <ProposalForm
                    onSubmit={handleSendProposal}
                    onCancel={() => setShowProposalForm(false)}
                    loading={actionLoading}
                    className="mb-6"
                />
            )}

            {/* Shipping Verification Form - only for shoppers after purchase */}
            {isShopper && request.status === 'purchased' && !request.shipping_verified && (
                <ShippingVerification
                    requestId={requestId}
                    estimatedShippingCost={request.shipping_deposit || 0}
                    onSubmitSuccess={handleShippingVerificationSubmit}
                    className="mb-6"
                />
            )}

            {/* Shipping Approval Request - for customers when additional payment is needed */}
            {isCustomer &&
                shippingVerification &&
                shippingVerification.needs_approval &&
                shippingVerification.status === 'pending_approval' && (
                    <ShippingApprovalRequest
                        verification={shippingVerification}
                        requestData={request}
                        onApprove={handleShippingApproval}
                        onReject={handleShippingRejection}
                        className="mb-6"
                    />
                )}

            {/* Messaging section - only visible when request is assigned or further along */}
            {(isCustomer || isShopper) && request.status !== 'open' && request.status !== 'cancelled' && (
                <MessagingSection
                    requestId={requestId}
                    userId={user?.id}
                    requestStatus={request.status}
                    otherPersonName={isCustomer ? shopperName : customerName}
                    isCustomer={isCustomer}
                />
            )}
            {/* Debug panel - only visible in development */}
            {process.env.NODE_ENV !== 'production' && (
                <RequestDebugPanel
                    requestId={requestId}
                    currentStatus={request?.status}
                />
            )}
        </div>
    );
}