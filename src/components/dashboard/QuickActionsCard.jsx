// src/components/dashboard/QuickActionsCard.jsx
import Link from 'next/link';
import { Plus, ShoppingBag, Search, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function QuickActionsCard({ isShopperProfile }) {
  if (isShopperProfile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button asChild className="w-full">
            <Link href="/shoppers/browse">
              <Search className="w-4 h-4 mr-2" />
              Browse Available Requests
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/shoppers/earnings">
              <Wallet className="w-4 h-4 mr-2" />
              View Earnings
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button asChild className="w-full">
          <Link href="/requests/new">
            <Plus className="w-4 h-4 mr-2" />
            Create New Request
          </Link>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link href="/shoppers">
            <ShoppingBag className="w-4 h-4 mr-2" />
            Browse Shoppers
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}