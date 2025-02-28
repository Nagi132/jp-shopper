import { 
    Clock, 
    User, 
    Wallet, 
    ShoppingBag, 
    Truck, 
    CheckCircle, 
    AlertCircle 
  } from 'lucide-react';
  
  export function getStatusColor(status) {
    const statusColors = {
      'open': 'bg-green-100 text-green-800',
      'assigned': 'bg-blue-100 text-blue-800',
      'paid': 'bg-purple-100 text-purple-800',
      'purchased': 'bg-yellow-100 text-yellow-800',
      'shipped': 'bg-indigo-100 text-indigo-800',
      'completed': 'bg-teal-100 text-teal-800',
      'cancelled': 'bg-red-100 text-red-800',
      'default': 'bg-gray-100 text-gray-800'
    };
    return statusColors[status] || statusColors['default'];
  }
  
  export function getStatusIcon(status) {
    // Return JSX elements instead of component references
    switch(status) {
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
  
  export function filterRequests(requests, type = 'all') {
    switch(type) {
      case 'active':
        return requests.filter(req => 
          ['assigned', 'paid', 'purchased', 'shipped'].includes(req.status)
        );
      case 'open':
        return requests.filter(req => req.status === 'open');
      case 'completed':
        return requests.filter(req => req.status === 'completed');
      default:
        return requests;
    }
  }