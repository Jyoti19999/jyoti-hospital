// Traffic indicator component for appointment slots

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TRAFFIC_INDICATORS } from '@/lib/trafficService';
import { Clock, Users, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const TrafficIndicator = ({ 
  trafficLevel, 
  waitTime, 
  patientsInQueue = 0, 
  size = 'default',
  showDetails = true,
  className = '' 
}) => {
  const indicator = TRAFFIC_INDICATORS[trafficLevel];
  
  if (!indicator) {
    return null;
  }
  
  const getTrafficIcon = (level) => {
    switch (level) {
      case 'low':
        return TrendingDown;
      case 'moderate':
        return Minus;
      case 'high':
        return TrendingUp;
      default:
        return Clock;
    }
  };
  
  const TrafficIcon = getTrafficIcon(trafficLevel);
  
  const getTrafficColors = (level) => {
    switch (level) {
      case 'low':
        return {
          bg: 'bg-green-50 dark:bg-green-950',
          text: 'text-green-700 dark:text-green-300',
          border: 'border-green-200 dark:border-green-800',
          badge: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
        };
      case 'moderate':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-950',
          text: 'text-yellow-700 dark:text-yellow-300',
          border: 'border-yellow-200 dark:border-yellow-800',
          badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
        };
      case 'high':
        return {
          bg: 'bg-red-50 dark:bg-red-950',
          text: 'text-red-700 dark:text-red-300',
          border: 'border-red-200 dark:border-red-800',
          badge: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
        };
      default:
        return {
          bg: 'bg-muted',
          text: 'text-muted-foreground',
          border: 'border-border',
          badge: 'bg-muted text-muted-foreground'
        };
    }
  };
  
  const colors = getTrafficColors(trafficLevel);
  
  const TrafficDisplay = () => (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Main Traffic Badge */}
      <Badge 
        className={`${colors.badge} border ${colors.border} ${size === 'large' ? 'px-3 py-1.5 text-sm' : 'px-2 py-1 text-xs'}`}
      >
        <TrafficIcon className={`${size === 'large' ? 'h-4 w-4' : 'h-3 w-3'} mr-1.5`} />
        {indicator.label}
      </Badge>
      
      {/* Wait Time */}
      {showDetails && waitTime && (
        <Badge variant="outline" className={`${size === 'large' ? 'text-sm' : 'text-xs'}`}>
          <Clock className={`${size === 'large' ? 'h-3.5 w-3.5' : 'h-3 w-3'} mr-1`} />
          {waitTime}
        </Badge>
      )}
      
      {/* Queue Count */}
      {showDetails && patientsInQueue > 0 && (
        <Badge variant="outline" className={`${size === 'large' ? 'text-sm' : 'text-xs'}`}>
          <Users className={`${size === 'large' ? 'h-3.5 w-3.5' : 'h-3 w-3'} mr-1`} />
          {patientsInQueue} waiting
        </Badge>
      )}
    </div>
  );
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-help">
            <TrafficDisplay />
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <div>
              <p className="font-medium flex items-center gap-2">
                <span className="text-lg">{indicator.icon}</span>
                {indicator.label}
              </p>
              <p className="text-sm text-muted-foreground">{indicator.description}</p>
            </div>
            
            {waitTime && (
              <div>
                <p className="font-medium">Expected Wait Time</p>
                <p className="text-sm text-muted-foreground">{waitTime}</p>
              </div>
            )}
            
            {patientsInQueue > 0 && (
              <div>
                <p className="font-medium">Patients in Queue</p>
                <p className="text-sm text-muted-foreground">{patientsInQueue} patients currently waiting</p>
              </div>
            )}
            
            <div className="pt-1 border-t">
              <p className="text-xs text-muted-foreground">
                Traffic levels update every 5 minutes based on current department load
              </p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default TrafficIndicator;