import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

/**
 * Fetch the default letterhead template
 */
export async function getDefaultLetterhead() {
  try {
    const response = await axios.get(`${API_URL}/letterhead/templates/default`, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    return null;
  }
}

/**
 * Fetch a specific letterhead template by ID
 */
export async function getLetterheadById(id) {
  try {
    const response = await axios.get(`${API_URL}/letterhead/templates/${id}`, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    return null;
  }
}

/**
 * Render letterhead elements to HTML
 */
export function renderLetterheadToHTML(template, hospitalData = {}) {
  if (!template || !template.elements) return '';

  const pageSettings = template.pageSettings || {};
  const canvasWidth = pageSettings.canvasWidth || 794;
  const canvasHeight = pageSettings.canvasHeight || 400;

  const elements = template.elements.map(element => {
    const style = `
      position: absolute;
      left: ${element.x || 0}px;
      top: ${element.y || 0}px;
      width: ${element.width || 200}px;
      height: ${element.height || 40}px;
      font-size: ${element.fontSize || 14}px;
      font-family: ${element.fontFamily || 'Arial'}, sans-serif;
      font-weight: ${element.fontWeight || 'normal'};
      font-style: ${element.fontStyle || 'normal'};
      text-decoration: ${element.textDecoration || 'none'};
      color: ${element.color || '#000000'};
      background-color: ${element.backgroundColor || 'transparent'};
      text-align: ${element.align || 'left'};
      display: flex;
      align-items: center;
      overflow: hidden;
      word-wrap: break-word;
      padding: 4px;
      box-sizing: border-box;
    `;

    if (element.type === 'logo') {
      const imgSrc = element.content || hospitalData.logo || '';
      if (imgSrc) {
        return `<div style="${style}">
          <img src="${imgSrc}" alt="Logo" style="width: 100%; height: 100%; object-fit: contain;" />
        </div>`;
      }
      return '';
    }

    // Use element.content first (what was typed in the designer), then fallback to hospitalData
    let content = element.content || '';
    if (!content) {
      switch (element.type) {
        case 'hospitalName': content = hospitalData.hospitalName || ''; break;
        case 'address': content = hospitalData.address
          ? `${hospitalData.address.street || ''}, ${hospitalData.address.city || ''}, ${hospitalData.address.state || ''} ${hospitalData.address.pincode || ''}`
          : ''; break;
        case 'phone': content = hospitalData.phone || ''; break;
        case 'email': content = hospitalData.email || ''; break;
        case 'website': content = hospitalData.website || ''; break;
        case 'registrationNo': content = hospitalData.registrationNumber || ''; break;
        default: break;
      }
    }

    if (!content) return '';

    // For text-align to work inside a flex container, we need justify-content
    const justifyMap = { left: 'flex-start', center: 'center', right: 'flex-end' };
    const justify = justifyMap[element.align] || 'flex-start';

    return `<div style="${style} justify-content: ${justify};">
      <span style="width: 100%; text-align: ${element.align || 'left'};">${content}</span>
    </div>`;
  });

  return `<div style="position: relative; width: ${canvasWidth}px; height: ${canvasHeight}px; margin: 0 auto; border-bottom: 2px solid #333; margin-bottom: 20px;">
    ${elements.filter(Boolean).join('')}
  </div>`;
}

/**
 * Apply letterhead to a document for printing
 */
export async function applyLetterheadToDocument(documentHTML, templateId = null, hospitalData = {}) {
  let template;
  
  if (templateId) {
    template = await getLetterheadById(templateId);
  } else {
    template = await getDefaultLetterhead();
  }

  if (!template) {
    return documentHTML; // Return original if no template found
  }

  const letterheadHTML = renderLetterheadToHTML(template, hospitalData);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @media print {
          @page {
            margin: 20mm;
          }
          body {
            margin: 0;
            padding: 0;
          }
        }
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
        }
      </style>
    </head>
    <body>
      ${letterheadHTML}
      ${documentHTML}
    </body>
    </html>
  `;
}

/**
 * Print document with letterhead
 */
export async function printWithLetterhead(documentHTML, templateId = null, hospitalData = {}) {
  const fullDocument = await applyLetterheadToDocument(documentHTML, templateId, hospitalData);
  
  const printWindow = window.open('', '_blank');
  printWindow.document.write(fullDocument);
  printWindow.document.close();
  
  // Wait for ALL images to fully load before printing
  const images = printWindow.document.querySelectorAll('img');
  const imagePromises = Array.from(images).map(img => {
    if (img.complete) return Promise.resolve();
    return new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = resolve;
    });
  });

  Promise.all(imagePromises).then(() => {
    setTimeout(() => {
      printWindow.print();
    }, 300);
  });
}

/**
 * Generate PDF with letterhead using jsPDF
 */
export async function generatePDFWithLetterhead(documentHTML, templateId = null, hospitalData = {}, filename = 'document.pdf') {
  const { jsPDF } = await import('jspdf');
  const html2canvas = (await import('html2canvas')).default;
  
  const fullDocument = await applyLetterheadToDocument(documentHTML, templateId, hospitalData);
  
  // Create a temporary container
  const container = document.createElement('div');
  container.innerHTML = fullDocument;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.width = '210mm'; // A4 width
  document.body.appendChild(container);
  
  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(filename);
  } finally {
    document.body.removeChild(container);
  }
}
