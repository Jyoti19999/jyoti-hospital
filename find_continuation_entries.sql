-- Find all PatientVisit entries with visitType = 'CONTINUATION'
SELECT 
    id,
    patientId,
    doctorId,
    visitDate,
    visitType,
    status,
    chiefComplaint,
    createdAt,
    updatedAt
FROM PatientVisit
WHERE visitType = 'CONTINUATION';

-- Count how many entries have CONTINUATION
SELECT COUNT(*) as continuation_count
FROM PatientVisit
WHERE visitType = 'CONTINUATION';

-- Show all distinct visitType values in the table
SELECT DISTINCT visitType, COUNT(*) as count
FROM PatientVisit
GROUP BY visitType
ORDER BY count DESC;
