'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CheckCircle, AlertCircle, Info, Truck } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

/**
 * Component for calculating and collecting shipping deposits
 * - Allows setting estimated shipping costs
 * - Calculates shipping based on weight/size
 * - Shows breakdown of costs to customer
 */
export default function ShippingDepositSystem({ 
  onShippingCostChange,
  initialCost = 0,
  disabled = false,
  className = ""
}) {
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [estimatedWeight, setEstimatedWeight] = useState(0.5);
  const [customShippingCost, setCustomShippingCost] = useState(initialCost || 2000);
  const [calculationMethod, setCalculationMethod] = useState('auto');
  
  // Base rates for different shipping methods (in JPY)
  const shippingRates = {
    standard: { base: 1500, perKg: 1000 },
    express: { base: 2500, perKg: 1700 },
    ems: { base: 2200, perKg: 1500 },
  };
  
  // Calculate shipping based on weight and method
  const calculateShipping = () => {
    if (calculationMethod === 'custom') {
      return customShippingCost;
    }
    
    const rate = shippingRates[shippingMethod];
    return Math.round(rate.base + (estimatedWeight * rate.perKg));
  };
  
  // Get the current shipping cost
  const shippingCost = calculateShipping();
  
  // Update parent component when shipping cost changes
  const handleCostChange = (cost) => {
    onShippingCostChange?.(cost);
  };
  
  // Handle shipping method change
  const handleMethodChange = (method) => {
    setShippingMethod(method);
    const newCost = calculationMethod === 'custom' 
      ? customShippingCost 
      : shippingRates[method].base + (estimatedWeight * shippingRates[method].perKg);
    
    handleCostChange(newCost);
  };
  
  // Handle weight change
  const handleWeightChange = (weight) => {
    const numWeight = parseFloat(weight) || 0.1;
    setEstimatedWeight(numWeight);
    
    if (calculationMethod === 'auto') {
      const newCost = shippingRates[shippingMethod].base + (numWeight * shippingRates[shippingMethod].perKg);
      handleCostChange(newCost);
    }
  };
  
  // Handle custom cost change
  const handleCustomCostChange = (cost) => {
    const numCost = parseInt(cost) || 0;
    setCustomShippingCost(numCost);
    
    if (calculationMethod === 'custom') {
      handleCostChange(numCost);
    }
  };
  
  // Handle calculation method change
  const handleCalcMethodChange = (method) => {
    setCalculationMethod(method);
    
    if (method === 'auto') {
      const autoCost = shippingRates[shippingMethod].base + (estimatedWeight * shippingRates[shippingMethod].perKg);
      handleCostChange(autoCost);
    } else {
      handleCostChange(customShippingCost);
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="bg-blue-50 border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center text-blue-800">
              <Truck className="mr-2 h-5 w-5" />
              Shipping Deposit Estimation
            </CardTitle>
            <CardDescription>
              Set an estimated shipping cost deposit
            </CardDescription>
          </div>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="text-blue-700">
                <Info className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-2">
                <h4 className="font-medium">About Shipping Deposits</h4>
                <p className="text-sm text-gray-600">
                  Customers pay an estimated shipping deposit upfront. After purchase, 
                  the shopper will submit the actual shipping cost with a receipt.
                </p>
                <p className="text-sm text-gray-600">
                  If the actual cost is less than the deposit, the customer will receive a refund
                  for the difference. If it's more, the shopper may request additional payment.
                </p>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Calculation Method Toggle */}
          <div className="flex space-x-4">
            <Button 
              variant={calculationMethod === 'auto' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => handleCalcMethodChange('auto')}
              disabled={disabled}
            >
              Automatic Calculation
            </Button>
            <Button 
              variant={calculationMethod === 'custom' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => handleCalcMethodChange('custom')}
              disabled={disabled}
            >
              Custom Amount
            </Button>
          </div>
          
          {calculationMethod === 'auto' ? (
            <>
              {/* Shipping Method Selection */}
              <div className="space-y-2">
                <Label htmlFor="shipping-method">Shipping Method</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button 
                    variant={shippingMethod === 'standard' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => handleMethodChange('standard')}
                    disabled={disabled}
                  >
                    Standard
                  </Button>
                  <Button 
                    variant={shippingMethod === 'express' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => handleMethodChange('express')}
                    disabled={disabled}
                  >
                    Express
                  </Button>
                  <Button 
                    variant={shippingMethod === 'ems' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => handleMethodChange('ems')}
                    disabled={disabled}
                  >
                    EMS
                  </Button>
                </div>
              </div>
              
              {/* Weight Estimation */}
              <div className="space-y-2">
                <Label htmlFor="weight">Estimated Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={estimatedWeight}
                  onChange={(e) => handleWeightChange(e.target.value)}
                  step="0.1"
                  min="0.1"
                  disabled={disabled}
                />
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="custom-shipping">Custom Shipping Cost (¥)</Label>
              <Input
                id="custom-shipping"
                type="number"
                value={customShippingCost}
                onChange={(e) => handleCustomCostChange(e.target.value)}
                min="0"
                disabled={disabled}
              />
            </div>
          )}
          
          {/* Cost Summary */}
          <div className="rounded-md border p-4 bg-gray-50">
            <div className="font-medium mb-2">Shipping Deposit</div>
            <div className="flex justify-between">
              <span className="text-gray-600">Estimated cost:</span>
              <span className="font-medium">¥{shippingCost.toLocaleString()}</span>
            </div>
            
            <div className="flex items-start space-x-2 text-sm text-blue-600 bg-blue-50 p-2 rounded mt-2">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>
                The actual shipping cost will be determined when the item is shipped. Adjustments will be made at that time.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}