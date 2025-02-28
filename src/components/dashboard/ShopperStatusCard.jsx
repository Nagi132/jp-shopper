// src/components/dashboard/ShopperStatusCard.jsx
import Link from 'next/link';
import { 
  CheckCircle, 
  MapPin, 
  Star 
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ShopperStatusCard({ profile }) {
  const shopperProfile = profile.shopper_profiles || {};

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shopper Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <StatusItem 
            icon={CheckCircle} 
            label="Verification" 
            value={shopperProfile.verification_level || 'Pending'}
          />
          <StatusItem 
            icon={MapPin} 
            label="Location" 
            value={shopperProfile.location || 'Not specified'}
          />
          <StatusItem 
            icon={Star} 
            label="Rating" 
            value={shopperProfile.rating 
              ? `${shopperProfile.rating}/5.0` 
              : 'No ratings yet'
            }
            starIcon={shopperProfile.rating}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <Link href="/profile">Edit Profile</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

function StatusItem({ icon: Icon, label, value, starIcon }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-700 flex items-center">
        <Icon className="w-4 h-4 mr-2 text-gray-500" />
        {label}:
      </span>
      <span className="text-gray-900 flex items-center">
        {value}
        {starIcon && <Star className="w-3 h-3 ml-1 text-yellow-500" />}
      </span>
    </div>
  );
}