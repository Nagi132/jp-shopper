// src/lib/functions/requestStatusHelpers.js
import { Clock, User, Wallet, ShoppingBag, Truck, CheckCircle, AlertCircle } from 'lucide-react';

export function getStatusColor(status) {
  switch (status) {
    case 'open': return 'bg-green-100 text-green-800';
    case 'assigned': return 'bg-blue-100 text-blue-800';
    case 'paid': return 'bg-purple-100 text-purple-800';
    case 'purchased': return 'bg-yellow-100 text-yellow-800';
    case 'shipped': return 'bg-indigo-100 text-indigo-800';
    case 'completed': return 'bg-teal-100 text-teal-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

export function getStatusIcon(status) {
  switch (status) {
    case 'open': return <Clock className="w-3 h-3" />;
    case 'assigned': return <User className="w-3 h-3" />;
    case 'paid': return <Wallet className="w-3 h-3" />;
    case 'purchased': return <ShoppingBag className="w-3 h-3" />;
    case 'shipped': return <Truck className="w-3 h-3" />;
    case 'completed': return <CheckCircle className="w-3 h-3" />;
    case 'cancelled': return <AlertCircle className="w-3 h-3" />;
    default: return null;
  }
}