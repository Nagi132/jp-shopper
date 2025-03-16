'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Switch } from '@/components/ui/switch';
import { ShoppingBag, User } from 'lucide-react';
import { Label } from '@/components/ui/label';

export default function RoleToggle({ initialMode = 'customer' }) {
  const [mode, setMode] = useState(initialMode);
  const router = useRouter();
  
  const handleToggleChange = (checked) => {
    const newMode = checked ? 'shopper' : 'customer';
    setMode(newMode);
    
    // Optional: store preference in localStorage
    localStorage.setItem('userMode', newMode);
    
    // Redirect to appropriate dashboard
    router.push(newMode === 'shopper' ? '/shopper/dashboard' : '/dashboard');
  };

  return (
    <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 rounded-full">
      <ShoppingBag 
        size={18} 
        className={mode === 'customer' ? 'text-blue-600' : 'text-gray-400'} 
      />
      
      <Switch
        checked={mode === 'shopper'}
        onCheckedChange={handleToggleChange}
        className="data-[state=checked]:bg-indigo-600"
      />
      
      <User 
        size={18} 
        className={mode === 'shopper' ? 'text-indigo-600' : 'text-gray-400'} 
      />
      
      <Label className="text-xs font-medium">
        {mode === 'customer' ? 'Customer' : 'Shopper'}
      </Label>
    </div>
  );
}