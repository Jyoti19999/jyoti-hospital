// Patient identity management service for UID and QR code generation

// Generate permanent UID for patient
export const generateUID = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `UID-${timestamp}-${random}`.toUpperCase();
};

// Generate QR code data structure
export const generateQRData = (uid, token, patientData, appointmentData) => {
  return {
    uid,
    token,
    patientName: patientData.name,
    patientPhone: patientData.phone,
    appointmentDate: appointmentData.date,
    appointmentTime: appointmentData.time,
    department: appointmentData.department,
    doctor: appointmentData.doctor,
    createdAt: new Date().toISOString(),
    version: '1.0'
  };
};

// Convert QR data to string for QR code generation
export const qrDataToString = (qrData) => {
  return JSON.stringify(qrData);
};

// Generate QR code SVG (simple implementation)
export const generateQRCodeSVG = (data, size = 200) => {
  // This is a simplified QR code representation
  // In a real implementation, you'd use a proper QR code library
  const gridSize = 21; // Standard QR code grid
  const cellSize = size / gridSize;
  
  // Create a simple pattern based on data hash
  const hash = hashString(data);
  const pattern = Array(gridSize).fill().map((_, i) => 
    Array(gridSize).fill().map((_, j) => (hash + i * j) % 3 === 0)
  );
  
  // Add finder patterns (corners)
  addFinderPattern(pattern, 0, 0);
  addFinderPattern(pattern, 0, gridSize - 7);
  addFinderPattern(pattern, gridSize - 7, 0);
  
  // Generate SVG
  let svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect width="${size}" height="${size}" fill="white"/>`;
  
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      if (pattern[i][j]) {
        const x = j * cellSize;
        const y = i * cellSize;
        svg += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="black"/>`;
      }
    }
  }
  
  svg += '</svg>';
  return svg;
};

// Generate barcode SVG (Code 128 style bars)
export const generateBarcodeSVG = (data, width = 300, height = 60) => {
  const hash = hashString(data);
  const barCount = 50;
  const barWidth = width / barCount;
  
  let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect width="${width}" height="${height}" fill="white"/>`;
  
  for (let i = 0; i < barCount; i++) {
    if ((hash + i) % 3 === 0) {
      const x = i * barWidth;
      const barHeight = height * (0.8 + 0.2 * ((hash + i) % 2));
      svg += `<rect x="${x}" y="${(height - barHeight) / 2}" width="${barWidth * 0.8}" height="${barHeight}" fill="black"/>`;
    }
  }
  
  svg += '</svg>';
  return svg;
};

// Simple string hash function
const hashString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

// Add finder patterns to QR code
const addFinderPattern = (pattern, startRow, startCol) => {
  for (let i = 0; i < 7; i++) {
    for (let j = 0; j < 7; j++) {
      const row = startRow + i;
      const col = startCol + j;
      if (row < pattern.length && col < pattern[0].length) {
        // Create finder pattern (7x7 square with specific pattern)
        const isEdge = i === 0 || i === 6 || j === 0 || j === 6;
        const isCenter = (i >= 2 && i <= 4) && (j >= 2 && j <= 4);
        pattern[row][col] = isEdge || isCenter;
      }
    }
  }
};

// Create data URL from SVG
export const svgToDataUrl = (svg) => {
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

// Generate complete identity package
export const generateIdentityPackage = (patientData, appointmentData, token) => {
  const uid = generateUID();
  const qrData = generateQRData(uid, token, patientData, appointmentData);
  const qrString = qrDataToString(qrData);
  
  return {
    uid,
    token,
    qrData,
    qrCode: {
      svg: generateQRCodeSVG(qrString),
      dataUrl: svgToDataUrl(generateQRCodeSVG(qrString))
    },
    barcode: {
      svg: generateBarcodeSVG(token),
      dataUrl: svgToDataUrl(generateBarcodeSVG(token))
    },
    createdAt: new Date().toISOString()
  };
};