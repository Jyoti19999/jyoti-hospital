// Token badge component with stage and priority indicators

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { parseToken, PRIORITY_DESCRIPTIONS } from '@/lib/tokenService';
import { Clock, AlertTriangle, User, Calendar, Activity } from 'lucide-react';

const TokenBadge = ({ 
  token, 
  size = 'default', 
  showTooltip = true, 
  showStage = true, 
  showPriority = true,
  className = '' 
}) => {
  const parsed = parseToken(token);
  
  if (!parsed) {
    return (
      <Badge variant="destructive" className={className}>
        Invalid Token
      </Badge>
    );
  }
  
  const getStageInfo = (stage) => {
    const stages = {
      'APPOINTMENT': {
        label: 'Booked',
        color: 'bg-blue-500',
        icon: Calendar,
        description: 'Appointment scheduled'
      },
      'REGISTERED': {
        label: 'Checked In',
        color: 'bg-green-500',
        icon: User,
        description: 'Patient registered and waiting'
      },
      'OPTOMETRIST': {
        label: 'With Optometrist',
        color: 'bg-yellow-500',
        icon: Activity,
        description: 'Optometrist examination complete'
      },
      'SURGERY': {
        label: 'Surgery Ready',
        color: 'bg-purple-500',
        icon: Activity,
        description: 'Prepared for surgical procedure'
      },
      'POST_OP': {
        label: 'Post-Op',
        color: 'bg-orange-500',
        icon: Activity,
        description: 'Post-operative follow-up'
      }
    };
    
    return stages[stage] || stages.APPOINTMENT;
  };
  
  const getPriorityInfo = (priority) => {
    const isHighPriority = priority <= 3;
    const isMediumPriority = priority <= 6;
    
    return {
      isHigh: isHighPriority,
      isMedium: isMediumPriority,
      color: isHighPriority ? 'text-red-600' : isMediumPriority ? 'text-yellow-600' : 'text-green-600',
      bgColor: isHighPriority ? 'bg-red-50' : isMediumPriority ? 'bg-yellow-50' : 'bg-green-50',
      icon: isHighPriority ? AlertTriangle : Clock
    };
  };
  
  const stageInfo = getStageInfo(parsed.stage);
  const priorityInfo = getPriorityInfo(parsed.priority);
  const StageIcon = stageInfo.icon;
  const PriorityIcon = priorityInfo.icon;
  
  const TokenDisplay = () => (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Main Token Badge */}
      <Badge 
        variant="outline" 
        className={`font-mono ${size === 'large' ? 'text-base px-3 py-1' : size === 'small' ? 'text-xs px-2 py-0.5' : 'text-sm px-2 py-1'}`}
      >
        {token}
      </Badge>
      
      {/* Stage Badge */}
      {showStage && (
        <Badge 
          className={`${stageInfo.color} text-white ${size === 'small' ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2 py-1'}`}
        >
          <StageIcon className={`${size === 'small' ? 'h-2.5 w-2.5' : 'h-3 w-3'} mr-1`} />
          {stageInfo.label}
        </Badge>
      )}
      
      {/* Priority Badge */}
      {showPriority && (
        <Badge 
          variant="outline"
          className={`${priorityInfo.color} ${priorityInfo.bgColor} border-current ${size === 'small' ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2 py-1'}`}
        >
          <PriorityIcon className={`${size === 'small' ? 'h-2.5 w-2.5' : 'h-3 w-3'} mr-1`} />
          P{parsed.priority}
        </Badge>
      )}
    </div>
  );
  
  if (!showTooltip) {
    return <TokenDisplay />;
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-help">
            <TokenDisplay />
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <div>
              <p className="font-medium">Token: {token}</p>
              <p className="text-xs text-muted-foreground">ID: {parsed.uniqueId}</p>
            </div>
            
            <div>
              <p className="font-medium">Stage: {stageInfo.label}</p>
              <p className="text-xs text-muted-foreground">{stageInfo.description}</p>
            </div>
            
            <div>
              <p className="font-medium">Priority: Level {parsed.priority}</p>
              <p className="text-xs text-muted-foreground">{parsed.priorityDescription}</p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default TokenBadge;