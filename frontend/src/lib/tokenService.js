// Token generation and management service for appointment workflow

export const STAGE_PREFIXES = {
  APPOINTMENT: 'A',    // Appointment booked
  REGISTERED: 'R',     // Checked-in and ready for optometrist
  OPTOMETRIST: 'O',    // Optometrist complete, ready for ophthalmologist
  SURGERY: 'S',        // Ready for surgery
  POST_OP: 'P'         // Post-surgery follow-up
};

export const PRIORITY_LEVELS = {
  EMERGENCY: 1,
  POST_OP: 2,
  PRE_OP: 3,
  CHILD_UNDER_5: 4,
  SENIOR_60_PLUS: 5,
  EXTENDED_WAIT: 6,
  REFERRAL: 7,
  REVIEW: 8,
  FOLLOW_UP: 9,
  NEW_PATIENT: 10,
  ROUTINE: 11
};

export const PRIORITY_DESCRIPTIONS = {
  1: 'Emergency - Immediate attention required',
  2: 'Post-operative - Follow-up care',
  3: 'Pre-operative - Surgery evaluation',
  4: 'Pediatric - Child under 5 years',
  5: 'Senior - Patient over 60 years',
  6: 'Extended wait - Time limit exceeded',
  7: 'Referral - From another specialist',
  8: 'Review - Previous case review',
  9: 'Follow-up - Routine follow-up visit',
  10: 'New patient - First visit',
  11: 'Routine - Standard check-up'
};

// Generate a 4-digit unique ID
export const generateUniqueId = () => {
  return Math.floor(1000 + Math.random() * 9000);
};

// Generate structured token: [Stage Prefix][Priority Number][4-digit ID]
export const generateToken = (stage = STAGE_PREFIXES.APPOINTMENT, priority = PRIORITY_LEVELS.ROUTINE) => {
  const uniqueId = generateUniqueId();
  return `${stage}${priority}-${uniqueId}`;
};

// Determine priority based on patient data
export const determinePriority = (patientData) => {
  const { age, isEmergency, visitType, appointmentType, hasReferral } = patientData;
  
  if (isEmergency) return PRIORITY_LEVELS.EMERGENCY;
  if (visitType === 'post-op') return PRIORITY_LEVELS.POST_OP;
  if (visitType === 'pre-op') return PRIORITY_LEVELS.PRE_OP;
  if (age < 5) return PRIORITY_LEVELS.CHILD_UNDER_5;
  if (age >= 60) return PRIORITY_LEVELS.SENIOR_60_PLUS;
  if (hasReferral) return PRIORITY_LEVELS.REFERRAL;
  if (appointmentType === 'review') return PRIORITY_LEVELS.REVIEW;
  if (appointmentType === 'follow-up') return PRIORITY_LEVELS.FOLLOW_UP;
  if (appointmentType === 'new-patient') return PRIORITY_LEVELS.NEW_PATIENT;
  
  return PRIORITY_LEVELS.ROUTINE;
};

// Parse token to extract components
export const parseToken = (token) => {
  const match = token.match(/^([A-Z])(\d+)-(\d{4})$/);
  if (!match) return null;
  
  const [, stagePrefix, priority, uniqueId] = match;
  return {
    stagePrefix,
    priority: parseInt(priority),
    uniqueId,
    stage: Object.keys(STAGE_PREFIXES).find(key => STAGE_PREFIXES[key] === stagePrefix),
    priorityDescription: PRIORITY_DESCRIPTIONS[priority]
  };
};

// Update token stage (for workflow progression)
export const updateTokenStage = (currentToken, newStage) => {
  const parsed = parseToken(currentToken);
  if (!parsed) return null;
  
  return `${STAGE_PREFIXES[newStage]}${parsed.priority}-${parsed.uniqueId}`;
};

// Check if token is expired (24-hour rule)
export const isTokenExpired = (tokenCreatedAt) => {
  const now = new Date();
  const created = new Date(tokenCreatedAt);
  const hoursDiff = (now - created) / (1000 * 60 * 60);
  return hoursDiff > 24;
};

// Generate token with metadata
export const createAppointmentToken = (patientData, appointmentData) => {
  const priority = determinePriority(patientData);
  const token = generateToken(STAGE_PREFIXES.APPOINTMENT, priority);
  
  return {
    token,
    priority,
    priorityDescription: PRIORITY_DESCRIPTIONS[priority],
    stage: 'APPOINTMENT',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    patientData,
    appointmentData
  };
};