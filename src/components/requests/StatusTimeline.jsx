export default function StatusTimeline({ currentStatus }) {
    const statuses = [
      'open',
      'assigned',
      'paid',
      'purchased',
      'shipped',
      'completed'
    ];
  
    // Find the index of the current status
    const currentIndex = statuses.indexOf(currentStatus);
  
    return (
      <div className="space-y-2">
        {statuses.map((status, index) => {
          // Status is active if it's the current one or has been passed
          const isActive = currentIndex >= index;
          
          return (
            <div key={status} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span className={`text-sm ${currentStatus === status ? 'font-medium' : ''}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            </div>
          );
        })}
      </div>
    );
  }