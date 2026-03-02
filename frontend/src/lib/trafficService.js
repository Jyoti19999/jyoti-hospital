// Traffic management and wait time estimation service

export const TRAFFIC_LEVELS = {
  LOW: 'low',
  MODERATE: 'moderate', 
  HIGH: 'high'
};

export const TRAFFIC_INDICATORS = {
  [TRAFFIC_LEVELS.LOW]: {
    label: 'Low traffic',
    description: 'Minimal wait time, walk-in preferred',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    waitTime: '5-10 minutes',
    icon: '🟢'
  },
  [TRAFFIC_LEVELS.MODERATE]: {
    label: 'Moderate flow',
    description: 'Likely to be called within 15 minutes',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    waitTime: '10-20 minutes',
    icon: '🟡'
  },
  [TRAFFIC_LEVELS.HIGH]: {
    label: 'High traffic',
    description: 'Expect longer wait times',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    waitTime: '20-40 minutes',
    icon: '🔴'
  }
};

// Simulate real-time traffic based on time and day
export const calculateTrafficLevel = (datetime, department = 'general') => {
  const hour = new Date(datetime).getHours();
  const dayOfWeek = new Date(datetime).getDay(); // 0 = Sunday, 6 = Saturday
  
  // Base traffic patterns
  let trafficScore = 0;
  
  // Time-based patterns
  if (hour >= 8 && hour <= 10) trafficScore += 3; // Morning rush
  else if (hour >= 11 && hour <= 13) trafficScore += 2; // Lunch time
  else if (hour >= 14 && hour <= 16) trafficScore += 4; // Afternoon peak
  else if (hour >= 17 && hour <= 19) trafficScore += 3; // Evening
  else trafficScore += 1; // Off-peak hours
  
  // Day-based patterns
  if (dayOfWeek >= 1 && dayOfWeek <= 5) trafficScore += 2; // Weekdays
  else trafficScore += 1; // Weekends
  
  // Department-specific modifiers
  const departmentModifiers = {
    'ophthalmology': 1.2,
    'optometry': 1.0,
    'emergency': 1.5,
    'surgery': 0.8,
    'general': 1.0
  };
  
  trafficScore *= (departmentModifiers[department] || 1.0);
  
  // Add random variation (±20%)
  const randomFactor = 0.8 + Math.random() * 0.4;
  trafficScore *= randomFactor;
  
  // Determine traffic level
  if (trafficScore <= 2) return TRAFFIC_LEVELS.LOW;
  if (trafficScore <= 4) return TRAFFIC_LEVELS.MODERATE;
  return TRAFFIC_LEVELS.HIGH;
};

// Generate appointment slots with traffic indicators
export const generateAppointmentSlots = (date, department = 'general') => {
  const slots = [];
  const baseDate = new Date(date);
  
  // Generate slots from 8 AM to 6 PM (every 30 minutes)
  for (let hour = 8; hour < 18; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const slotTime = new Date(baseDate);
      slotTime.setHours(hour, minute, 0, 0);
      
      // Skip slots in the past
      if (slotTime <= new Date()) continue;
      
      const traffic = calculateTrafficLevel(slotTime, department);
      const indicator = TRAFFIC_INDICATORS[traffic];
      
      // Simulate availability (80% of slots available)
      const isAvailable = Math.random() > 0.2;
      
      slots.push({
        time: slotTime.toISOString(),
        displayTime: slotTime.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        }),
        traffic,
        indicator,
        isAvailable,
        estimatedWaitTime: indicator.waitTime,
        patientsInQueue: Math.floor(Math.random() * 8) + 1
      });
    }
  }
  
  return slots;
};

// Calculate wait time based on current queue and traffic
export const calculateWaitTime = (trafficLevel, queuePosition = 1) => {
  const baseWaitTimes = {
    [TRAFFIC_LEVELS.LOW]: 8,     // 8 minutes average
    [TRAFFIC_LEVELS.MODERATE]: 15, // 15 minutes average
    [TRAFFIC_LEVELS.HIGH]: 30      // 30 minutes average
  };
  
  const baseTime = baseWaitTimes[trafficLevel];
  const queueMultiplier = Math.max(1, Math.log(queuePosition + 1) * 0.5);
  const randomVariation = 0.8 + Math.random() * 0.4;
  
  const estimatedMinutes = Math.round(baseTime * queueMultiplier * randomVariation);
  
  return {
    minutes: estimatedMinutes,
    range: `${Math.max(5, estimatedMinutes - 5)}-${estimatedMinutes + 10} minutes`,
    display: estimatedMinutes <= 60 ? 
      `${estimatedMinutes} minutes` : 
      `${Math.round(estimatedMinutes / 60 * 10) / 10} hours`
  };
};

// Get current department load
export const getDepartmentLoad = (department) => {
  const loads = {
    'ophthalmology': Math.floor(Math.random() * 15) + 5,
    'optometry': Math.floor(Math.random() * 20) + 8,
    'emergency': Math.floor(Math.random() * 25) + 10,
    'surgery': Math.floor(Math.random() * 8) + 2,
    'general': Math.floor(Math.random() * 30) + 15
  };
  
  return loads[department] || loads.general;
};

// Simulate real-time updates (for demo purposes)
export const getTrafficUpdate = (currentTraffic) => {
  const changeChance = 0.1; // 10% chance of traffic level change
  
  if (Math.random() > changeChance) {
    return currentTraffic; // No change
  }
  
  // Traffic can shift one level up or down
  const levels = [TRAFFIC_LEVELS.LOW, TRAFFIC_LEVELS.MODERATE, TRAFFIC_LEVELS.HIGH];
  const currentIndex = levels.indexOf(currentTraffic);
  
  const possibleChanges = [];
  if (currentIndex > 0) possibleChanges.push(levels[currentIndex - 1]);
  if (currentIndex < levels.length - 1) possibleChanges.push(levels[currentIndex + 1]);
  
  return possibleChanges.length > 0 ? 
    possibleChanges[Math.floor(Math.random() * possibleChanges.length)] : 
    currentTraffic;
};