import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

/**
 * ElapsedTimer Component
 * Shows elapsed time since surgery started (similar to countdown timer for eye drops)
 * Updates every second to show real-time elapsed duration
 */
const ElapsedTimer = ({ startTime, surgeryId }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime) {
      setElapsed(0);
      return;
    }

    const calculateElapsed = () => {
      const now = new Date();
      const start = new Date(startTime);
      const diff = Math.max(0, Math.floor((now - start) / 1000)); // elapsed in seconds
      return diff;
    };

    // Initial calculation
    const initialElapsed = calculateElapsed();
    setElapsed(initialElapsed);

    // Update every second
    const interval = setInterval(() => {
      const currentElapsed = calculateElapsed();
      setElapsed(currentElapsed);
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [startTime, surgeryId]);

  const formatElapsedTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  if (elapsed === 0) {
    return null;
  }

  return (
    <Badge className="bg-green-100 text-green-800 border-green-300 animate-pulse">
      <Clock className="h-3 w-3 mr-1" />
      {formatElapsedTime(elapsed)} elapsed
    </Badge>
  );
};

export default ElapsedTimer;
