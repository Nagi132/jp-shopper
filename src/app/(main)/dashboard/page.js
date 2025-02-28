'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { getCorrectShopperProfile } from '@/lib/functions/getCorrectShopperProfile';
import { useShopperRequests } from '@/lib/hooks/useShopperRequests';
import { useCustomerRequests } from '@/lib/hooks/useCustomerRequests';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import StatCard from '@/components/dashboard/StatCard';
import ShopperStatusCard from '@/components/dashboard/ShopperStatusCard';
import QuickActionsCard from '@/components/dashboard/QuickActionsCard';
import ActiveRequestsCard from '@/components/dashboard/ActiveRequestsCard';
import RequestsList from '@/components/dashboard/RequestsList';
import ProfilePrompt from '@/components/dashboard/ProfilePrompt';
import ErrorDisplay from '@/components/ui/ErrorDisplay';
import { DashboardSkeleton } from '@/components/ui/LoadingSkeleton';
import { Clock, Package, CheckCircle, ShoppingBag, Search, Star } from 'lucide-react';

export default function Dashboard() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const router = useRouter();

    // Load shopper requests if user is a shopper
    const {
        requests: shopperRequests,
        stats: shopperStats,
        loading: shopperLoading,
        error: shopperError,
        refresh: refreshShopperData
    } = useShopperRequests(profile?.shopper_profiles?.id);

    // Load customer requests if user is a customer
    const {
        requests: customerRequests,
        stats: customerStats,
        loading: customerLoading,
        error: customerError,
        refresh: refreshCustomerData
    } = useCustomerRequests(profile?.user_id);

    // Pick the right data based on user type
    const requests = profile?.is_shopper ? shopperRequests : customerRequests;
    const stats = profile?.is_shopper ? shopperStats : customerStats;
    const dataLoading = profile?.is_shopper ? shopperLoading : customerLoading;
    const dataError = profile?.is_shopper ? shopperError : customerError;

    const loadProfile = async () => {
        try {
            setRefreshing(true);

            // Get current user
            const { data: authData, error: authError } = await supabase.auth.getUser();

            if (authError) {
                throw authError;
            }

            if (!authData.user) {
                router.push('/login');
                return;
            }

            // Get user profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*, shopper_profiles(*)')
                .eq('user_id', authData.user.id)
                .single();

            if (profileError) {
                if (profileError.code === 'PGRST116') {
                    setProfile(null);
                    setLoading(false);
                    return;
                }
                throw profileError;
            }

            // If user is a shopper, ensure they have the correct shopper profile
            if (profileData.is_shopper) {
                const shopperProfile = await getCorrectShopperProfile(authData.user.id);
                if (shopperProfile) {
                    profileData.shopper_profiles = shopperProfile;
                }
            }

            setProfile(profileData);

        } catch (err) {
            console.error('Error loading profile:', err);
            setError(`Failed to load profile: ${err.message}`);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadProfile();
    }, [router]);

    const handleRefresh = () => {
        loadProfile();
        if (profile?.is_shopper) {
            refreshShopperData();
        } else {
            refreshCustomerData();
        }
    };

    if (loading) {
        return <DashboardSkeleton />;
    }

    if (error) {
        return <ErrorDisplay error={error} onRetry={loadProfile} />;
    }

    if (!profile) {
        return <ProfilePrompt />;
    }

    return (
        <DashboardLayout
            profile={profile}
            refreshing={refreshing || dataLoading}
            onRefresh={handleRefresh}
        >
            {/* Statistics Cards */}
            <div className="grid gap-6 md:grid-cols-4">
                {profile.is_shopper ? (
                    <>
                        <StatCard
                            title="Active Jobs"
                            value={stats.active}
                            icon={<Package className="w-5 h-5" />}
                            color="bg-indigo-50"
                        />
                        <StatCard
                            title="Open Requests"
                            value={stats.open}
                            icon={<Search className="w-5 h-5" />}
                            color="bg-blue-50"
                        />
                        <StatCard
                            title="Completed"
                            value={stats.completed}
                            icon={<CheckCircle className="w-5 h-5" />}
                            color="bg-green-50"
                        />
                        <StatCard
                            title="Rating"
                            value={profile.shopper_profiles?.rating || '-'}
                            icon={<Star className="w-5 h-5" />}
                            color="bg-yellow-50"
                        />
                    </>
                ) : (
                    <>
                        <StatCard
                            title="Open Requests"
                            value={stats.open}
                            icon={<Clock className="w-5 h-5" />}
                            color="bg-blue-50"
                        />
                        <StatCard
                            title="Active Requests"
                            value={stats.active}
                            icon={<Package className="w-5 h-5" />}
                            color="bg-indigo-50"
                        />
                        <StatCard
                            title="Completed"
                            value={stats.completed}
                            icon={<CheckCircle className="w-5 h-5" />}
                            color="bg-green-50"
                        />
                        <StatCard
                            title="Total Requests"
                            value={stats.total}
                            icon={<ShoppingBag className="w-5 h-5" />}
                            color="bg-gray-50"
                        />
                    </>
                )}
            </div>

            {/* Main Dashboard Content */}
            <div className="grid gap-6 md:grid-cols-2">
                {profile.is_shopper ? (
                    <>
                        <ShopperStatusCard profile={profile} />
                        <QuickActionsCard isShopper={true} />
                    </>
                ) : (
                    <>
                        <QuickActionsCard isShopper={false} />
                        {stats.active > 0 && (
                            <ActiveRequestsCard
                                requests={requests.filter(r =>
                                    ['assigned', 'paid', 'purchased', 'shipped'].includes(r.status)
                                )}
                            />
                        )}
                    </>
                )}
            </div>

            {/* Active Jobs Section for Shoppers */}
            {profile.is_shopper && stats.active > 0 && (
                <ActiveRequestsCard
                    title="Your Active Jobs"
                    description="Requests you're currently working on"
                    requests={requests.filter(r =>
                        ['assigned', 'paid', 'purchased', 'shipped'].includes(r.status)
                    )}
                />
            )}

            {/* Open Requests Section */}
            <RequestsList
                requests={profile.is_shopper
                    ? requests.filter(r => r.status === 'open')
                    : requests
                }
                emptyTitle={profile.is_shopper ? "Open Requests" : "Recent Requests"}
                emptyDescription={profile.is_shopper
                    ? "No open requests available at the moment"
                    : "You haven't created any shopping requests yet"
                }
                maxItems={profile.is_shopper ? 3 : 5}
                onCreateNew={!profile.is_shopper
                    ? () => router.push('/requests/new')
                    : undefined}
                showViewAll={true}
            />
            {/* Completed Requests for Shoppers */}
            {profile.is_shopper && stats.completed > 0 && (
                <RequestsList
                    requests={requests.filter(r => r.status === 'completed')}
                    emptyTitle="Recently Completed"
                    emptyDescription="Your successfully completed requests"
                    maxItems={3}
                    showViewAll={true}
                />
            )}
        </DashboardLayout>
    );
}