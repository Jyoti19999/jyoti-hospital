import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FileText, Download, Eye, Printer } from "lucide-react";
import axios from 'axios';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

const PrescriptionPreviewTab = ({
    // Detailed Examination data
    detailedExamData,
    // My Examination data
    examinationNotes,
    selectedDiagnoses,
    treatmentPlan,
    // Treatment Plan data (prescription)
    prescriptionItems,
    generalInstructions,
    followUpInstructions,
    // Additional tests - can be passed as individual props OR as additionalOrders object
    octChecked,
    visualFieldChecked,
    fundusPhotographyChecked,
    angiographyChecked,
    otherTestChecked,
    otherTestsText,
    additionalOrders, // NEW: JSON object from database
    optometristExamData, // NEW: Optometrist examination data
    // Follow-up
    followUpRequired,
    followUpPeriod,
    followUpDays,
    followUpDate,
    // Surgery
    surgerySuggested,
    selectedSurgeryTypeId,
    surgeryTypes,
    // Patient data
    patientData,
    // Doctor name
    doctorName,
}) => {
    // Get surgery type name
    const selectedSurgeryType = surgeryTypes?.find(st => st.id === selectedSurgeryTypeId);
    const surgeryTypeName = selectedSurgeryType ? `${selectedSurgeryType.category} - ${selectedSurgeryType.name}` : 'Surgery Type Not Specified';

    // Build additional tests object dynamically
    // Priority: use additionalOrders from DB if available, otherwise use individual props
    const additionalTests = additionalOrders || {
        oct: octChecked,
        visualField: visualFieldChecked,
        fundusPhotography: fundusPhotographyChecked,
        angiography: angiographyChecked,
        other: otherTestChecked ? otherTestsText : null
    };

    // Filter to get only checked tests and format them
    const checkedTests = Object.entries(additionalTests)
        .filter(([key, value]) => {
            // For boolean values, check if true
            // For string values (like "other"), check if not empty
            return value === true || (typeof value === 'string' && value.trim() !== '');
        })
        .map(([key, value]) => {
            const testNames = {
                oct: 'OCT',
                visualField: 'Visual Field Test',
                fundusPhotography: 'Fundus Photography',
                angiography: 'Fluorescein Angiography',
                other: typeof value === 'string' ? `Other: ${value}` : 'Other'
            };
            return testNames[key] || key.replace(/([A-Z])/g, ' $1').trim(); // Convert camelCase to readable
        });

    // State for letterhead and sections
    const [letterhead, setLetterhead] = useState(null);
    const [selectedSections, setSelectedSections] = useState({
        visualAcuity: false,
        refraction: false,
        tonometry: false,
        additionalTests: false,
        slitLamp: false,
    });

    // Load letterhead template
    useEffect(() => {
        const loadLetterhead = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${API_BASE_URL}/letterhead/templates`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                // Find the r_t template (case insensitive)
                const rtTemplate = response.data.find(t =>
                    t.name && t.name.toLowerCase().includes('r_t')
                );

                // If not found, try to find default
                const templateToUse = rtTemplate || response.data.find(t => t.isDefault) || response.data[0];

                if (templateToUse) {
                    setLetterhead(templateToUse);
                } else {
                }
            } catch (error) {
                if (error.response?.data?.error === 'Insufficient permissions') {
                }
            }
        };
        loadLetterhead();
    }, []);

    // Detailed Examination sections
    const detailedSections = [
        { id: 'visualAcuity', label: 'Visual Acuity Assessment', icon: '👁️' },
        { id: 'refraction', label: 'Refraction Details', icon: '🔍' },
        { id: 'tonometry', label: 'Intraocular Pressure (IOP)', icon: '💧' },
        { id: 'additionalTests', label: 'Additional Clinical Tests', icon: '🧪' },
        { id: 'slitLamp', label: 'Slit Lamp Examination', icon: '🔬' },
    ];

    const toggleSection = (sectionId) => {
        setSelectedSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId]
        }));
    };

    const handleDownloadPrescription = async () => {
        try {
            // Show loading state
            const loadingToast = toast.loading('Generating PDF...');

            // Import libraries dynamically
            const { default: html2canvas } = await import('html2canvas');
            const { jsPDF } = await import('jspdf');

            // Create a temporary container with full HTML structure
            const tempContainer = document.createElement('div');
            tempContainer.style.position = 'absolute';
            tempContainer.style.left = '-9999px';
            tempContainer.style.width = '794px'; // A4 width in pixels
            tempContainer.style.backgroundColor = 'white';

            // Generate content with inline styles
            const printContent = generatePrintContent();

            // Create full HTML with styles
            const fullHTML = `
                <div style="font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.3; padding: 38px 30px; background: white;">
                    <style>
                        table { 
                            width: 100%; 
                            border-collapse: collapse; 
                            margin: 5px 0 10px 0; 
                            page-break-inside: avoid;
                        }
                        th, td { 
                            border: 1px solid #d1d5db; 
                            padding: 4px 6px; 
                            text-align: center;
                            font-size: 10pt;
                        }
                        th { 
                            background-color: #f3f4f6; 
                            font-weight: bold;
                        }
                        .section { 
                            margin: 5px 0 8px 0; 
                            padding: 0;
                            page-break-inside: auto;
                        }
                        .page-break-before {
                            page-break-before: always;
                            margin-top: 20mm;
                        }
                        .highlight { 
                            background-color: #fef3c7; 
                            border-left: 3px solid #f59e0b; 
                            padding: 6px;
                            margin: 6px 0;
                        }
                        p { margin: 6px 0; }
                        ul { margin: 4px 0; padding-left: 20px; list-style-type: disc; }
                        .section-title { font-weight: bold; margin: 8px 0 4px 0; page-break-after: avoid; }
                        .signature-block { text-align: right; margin-top: 30px; page-break-inside: avoid; }
                        .inline-data { display: inline-block; margin-right: 15px; }
                        hr { border: 1px solid #ccc; margin: 10px 0; }
                    </style>
                    ${printContent}
                </div>
            `;

            tempContainer.innerHTML = fullHTML;
            document.body.appendChild(tempContainer);

            // Wait for images to load
            const images = tempContainer.getElementsByTagName('img');
            const imagePromises = Array.from(images).map(img => {
                return new Promise((resolve) => {
                    if (img.complete) {
                        resolve();
                    } else {
                        img.onload = resolve;
                        img.onerror = resolve; // Continue even if image fails
                        // Timeout after 5 seconds
                        setTimeout(resolve, 5000);
                    }
                });
            });

            await Promise.all(imagePromises);

            // Generate PDF
            const canvas = await html2canvas(tempContainer, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                windowWidth: 794, // A4 width in pixels at 96 DPI
            });

            // Remove temporary container
            document.body.removeChild(tempContainer);

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = pdfWidth;
            const imgHeight = (canvas.height * pdfWidth) / canvas.width;

            let heightLeft = imgHeight;
            let position = 0;

            // Add first page
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;

            // Add additional pages if needed
            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pdfHeight;
            }

            // Download PDF
            const fileName = `Prescription_${patientData?.fullName || 'Patient'}_${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}.pdf`;
            pdf.save(fileName);

            toast.dismiss(loadingToast);
            toast.success('PDF downloaded successfully');
        } catch (error) {
            toast.error('Failed to generate PDF: ' + error.message);
        }
    };

    const renderLetterhead = () => {

        if (!letterhead) {
            return '';
        }

        if (!letterhead.elements || letterhead.elements.length === 0) {
            return '';
        }


        // Calculate height based on elements
        const maxY = Math.max(...letterhead.elements.map(el => el.y + el.height), 150);
        let headerHTML = `<div style="position: relative; width: 100%; height: ${maxY}px; margin-bottom: 2px;">`;

        letterhead.elements.forEach((element, index) => {


            const style = `
                position: absolute;
                left: ${element.x}px;
                top: ${element.y}px;
                width: ${element.width}px;
                height: ${element.height}px;
                font-size: ${element.fontSize}px;
                font-family: ${element.fontFamily || 'Arial'};
                font-weight: ${element.fontWeight || 'normal'};
                font-style: ${element.fontStyle || 'normal'};
                text-decoration: ${element.textDecoration || 'none'};
                color: ${element.color || '#000000'};
                text-align: ${element.align || 'left'};
                display: flex;
                align-items: center;
            `;

            if (element.type === 'logo') {
                if (element.content) {
                    // Ensure the image is visible and properly styled
                    headerHTML += `<div style="${style}">
                        <img src="${element.content}" alt="Logo" 
                             style="width: 100%; height: 100%; object-fit: contain; display: block;" />
                    </div>`;
                } else {
                    headerHTML += `<div style="${style} border: 2px dashed #ccc; background: #f5f5f5; justify-content: center;">
                        <span style="color: #999;">Logo</span>
                    </div>`;
                }
            } else {
                const content = element.content || '';
                headerHTML += `<div style="${style}">${content}</div>`;
            }
        });

        headerHTML += '</div><hr style="border: 1px solid #ccc; margin: 5px 0;" />';
        return headerHTML;
    };

    const handlePrintPrescription = () => {
        // Create a printable version
        const printWindow = window.open('', '_blank');
        const printContent = generatePrintContent();

        printWindow.document.write(`
            <html>
                <head>
                    <title>Prescription</title>
                    <style>
                        @page {
                            size: A4;
                            margin: 20mm 10mm 15mm 10mm;
                        }
                        
                        @page :first {
                            margin-top: 10mm;
                        }
                        
                        /* Hide browser's default header and footer */
                        @media print {
                            @page { margin: 20mm 10mm 15mm 10mm; }
                            @page :first { margin-top: 10mm; }
                            body { margin: 0; }
                        }
                        
                        body { 
                            font-family: Arial, sans-serif; 
                            margin: 0;
                            padding: 10mm 10mm 15mm 10mm;
                            font-size: 11pt;
                            line-height: 1.3;
                        }
                        h2 { 
                            color: #059669; 
                            margin: 8px 0 5px 0;
                            font-size: 13pt;
                            page-break-after: avoid;
                        }
                        h3 { 
                            color: #4b5563; 
                            margin: 6px 0 4px 0;
                            font-size: 11pt;
                            page-break-after: avoid;
                        }
                        table { 
                            width: 100%; 
                            border-collapse: collapse; 
                            margin: 5px 0 10px 0; 
                            page-break-inside: avoid;
                        }
                        tbody tr {
                            page-break-inside: avoid;
                        }
                        th, td { 
                            border: 1px solid #d1d5db; 
                            padding: 4px 6px; 
                            text-align: center;
                            font-size: 10pt;
                        }
                        th { background-color: #f3f4f6; }
                        .section { 
                            margin: 5px 0 8px 0; 
                            padding: 0;
                            page-break-inside: auto;
                        }
                        .page-break-before {
                            page-break-before: always;
                            margin-top: 20mm;
                        }
                        .highlight { 
                            background-color: #fef3c7; 
                            border-left: 3px solid #f59e0b; 
                            padding: 6px;
                            margin: 6px 0;
                            page-break-inside: avoid;
                        }
                        p { margin: 6px 0; }
                        ul { margin: 4px 0; padding-left: 20px; list-style-type: disc; }
                        .section-title { font-weight: bold; margin: 8px 0 4px 0; page-break-after: avoid; }
                        .signature-block { text-align: right; margin-top: 30px; page-break-inside: avoid; }
                        .inline-data { display: inline-block; margin-right: 15px; }
                        @media print {
                            .no-print { display: none; }
                            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
                        }
                    </style>
                </head>
                <body>
                    ${printContent}
                </body>
            </html>
            <script>
                // Wait for all images to load before printing
                window.onload = function() {
                    const images = document.getElementsByTagName('img');
                    let loadedImages = 0;
                    const totalImages = images.length;
                    
                    if (totalImages === 0) {
                        // No images, print immediately
                        setTimeout(() => window.print(), 100);
                        return;
                    }
                    
                    function checkAllImagesLoaded() {
                        loadedImages++;
                        if (loadedImages === totalImages) {
                            // All images loaded, now print
                            setTimeout(() => {
                                window.print();
                            }, 100);
                        }
                    }
                    
                    // Add load event listeners to all images
                    for (let i = 0; i < totalImages; i++) {
                        if (images[i].complete) {
                            checkAllImagesLoaded();
                        } else {
                            images[i].onload = checkAllImagesLoaded;
                            images[i].onerror = checkAllImagesLoaded; // Continue even if image fails
                        }
                    }
                };
                
                // Close window when print dialog is cancelled or completed
                window.onafterprint = function() {
                    window.close();
                };
                
                // Show helpful message about removing headers/footers
                window.onbeforeprint = function() {
                };
            </script>
        `);

        printWindow.document.close();
    }

    const generatePrintContent = () => {
        let content = '';

        // Log the detailed exam data to see what we're working with
        if (detailedExamData?.additionalTests) {
        }

        // Add letterhead
        const letterheadHTML = renderLetterhead();
        content += letterheadHTML;

        // If no letterhead, add a simple header
        if (!letterheadHTML) {
            content += `
                <div style="text-align: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #333;">
                    <h1 style="margin: 0; color: #2563eb;">Medical Prescription</h1>
                    <p style="margin: 5px 0; color: #666;">Ophthalmology Department</p>
                </div>
            `;
        }

        // Patient info - compact format
        if (patientData) {
            const age = patientData.age || patientData.dateOfBirth ?
                (patientData.age || Math.floor((new Date() - new Date(patientData.dateOfBirth)) / 31557600000)) : 'N/A';
            const gender = patientData.gender || 'N/A';
            const referredBy = patientData.referredBy || patientData.referredByDoctor;

            content += `<div style="margin-bottom: 10px; padding: 6px; background: #f9fafb;">
                <strong>Patient:</strong> ${patientData.fullName || 'N/A'} &nbsp;|&nbsp; 
                <strong>Age/Gender:</strong> ${age}/${gender} &nbsp;|&nbsp; 
                <strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')}
                ${referredBy ? `&nbsp;|&nbsp; <strong>Referred by:</strong> Dr. ${referredBy}` : ''}
            </div>`;
        }

        // Clinical Examination - no borders
        content += '<div class="section">';
        content += '<p class="section-title">Clinical Examination</p>';
        if (examinationNotes) content += `<p>${examinationNotes}</p>`;

        // Preliminary Diagnosis from detailed examination
        if (detailedExamData?.preliminaryDiagnosis) {
            content += `<p><strong>Preliminary Diagnosis:</strong> ${detailedExamData.preliminaryDiagnosis}</p>`;
        }

        // Final Diagnosis
        if (selectedDiagnoses && selectedDiagnoses.length > 0) {
            content += '<p><strong>Diagnosis:</strong> ';
            content += selectedDiagnoses.map(d => d.title?.['@value'] || d.title || d.diseaseName || d.name).join(', ');
            content += '</p>';
        }

        if (checkedTests.length > 0) {
            content += '<p><strong>Additional Tests:</strong></p><ul>';
            checkedTests.forEach(test => {
                content += `<li>${test}</li>`;
            });
            content += '</ul>';
        }
        if (followUpRequired) {
            content += `<p><strong>Follow-up:</strong> ${followUpPeriod || ''} ${followUpDays ? `(${followUpDays} days)` : ''}</p>`;
        }
        if (surgerySuggested) {
            content += `<div class="highlight"><strong>⚕️ Surgery Recommended:</strong> ${surgeryTypeName}</div>`;
        }
        if (treatmentPlan) content += `<p><strong>Treatment Plan:</strong> ${treatmentPlan}</p>`;
        content += '</div>';

        // Detailed Examination Sections - with bullet points
        if (Object.values(selectedSections).some(v => v)) {

            if (selectedSections.visualAcuity && detailedExamData?.visualAcuity) {
                content += '<div class="section"><p class="section-title">Visual Acuity Assessment</p><ul>';
                const va = detailedExamData.visualAcuity;
                content += `<li><strong>Distance Vision:</strong> OD: ${va.distanceOD || '-'}, OS: ${va.distanceOS || '-'}, Binocular: ${va.distanceBinocular || '-'}</li>`;
                content += `<li><strong>Near Vision:</strong> OD: ${va.nearOD || '-'}, OS: ${va.nearOS || '-'}, Binocular: ${va.nearBinocular || '-'}</li>`;
                content += '</ul></div>';
            }

            if (selectedSections.refraction && detailedExamData?.refraction) {
                content += '<div class="section"><p class="section-title">Refraction Details</p><ul>';
                const ref = detailedExamData.refraction;
                content += `<li><strong>Right Eye (OD):</strong> Sphere: ${ref.refractionSphereOD || '-'}, Cylinder: ${ref.refractionCylinderOD || '-'}, Axis: ${ref.refractionAxisOD || '-'}, Add: ${ref.refractionAddOD || '-'}</li>`;
                content += `<li><strong>Left Eye (OS):</strong> Sphere: ${ref.refractionSphereOS || '-'}, Cylinder: ${ref.refractionCylinderOS || '-'}, Axis: ${ref.refractionAxisOS || '-'}, Add: ${ref.refractionAddOS || '-'}</li>`;
                content += `<li><strong>PD:</strong> ${ref.refractionPD || '-'}</li>`;
                content += '</ul></div>';
            }

            if (selectedSections.tonometry && detailedExamData?.tonometry) {
                content += '<div class="section"> <strong><p class="section-title">Intraocular Pressure (IOP):</p></strong>';
                const iop = detailedExamData.tonometry;
                // Display IOP in single horizontal line
                content += `<p><span class="inline-data">OD: ${iop.iopOD || '-'} mmHg</span>`;
                content += `<span class="inline-data">OS: ${iop.iopOS || '-'} mmHg</span>`;
                content += `<span class="inline-data">Method: ${iop.iopMethod || '-'}</span></p>`;
                content += '</div>';
            }

            if (selectedSections.additionalTests && detailedExamData?.additionalTests) {
                content += '<div class="section"><h3 style="color: black; font-weight: bold;">Additional Clinical Tests</h3>';
                const tests = detailedExamData.additionalTests;

                content += `<ul style="margin-top: 6px;">
               <li>Pupil Reaction: ${tests.pupilReaction || '-'}</li>
               <li>Eye Alignment: ${tests.eyeAlignment || '-'}</li>
               <li>Extraocular Movements: ${tests.extraocularMovements || '-'}</li>
               <li>Cover Test: ${tests.coverTest || '-'}</li>
                <li>Color Vision: ${tests.colorVision || '-'}</li>
              </ul>`;

                // Show Optometrist's Anterior Segment findings if available
                if (optometristExamData?.examinationData?.anteriorSegment) {
                    const optomAnteriorSegment = optometristExamData.examinationData.anteriorSegment;
                    let displayValue = optomAnteriorSegment;

                    // If it's a JSON object with "findings", extract that
                    if (typeof optomAnteriorSegment === 'object' && optomAnteriorSegment.findings) {
                        displayValue = optomAnteriorSegment.findings;
                    } else if (typeof optomAnteriorSegment === 'string') {
                        try {
                            const parsed = JSON.parse(optomAnteriorSegment);
                            if (parsed.findings) {
                                displayValue = parsed.findings;
                            }
                        } catch (e) {
                            // Use as is
                        }
                    }

                    content += `<p><strong>Anterior Segment (Optometrist):</strong> ${displayValue}</p>`;
                }

                // Format Anterior Segment properly
                if (tests.anteriorSegment) {


                    // Don't show the ophthalmologist's anteriorSegment here
                    // (It's the same as Slit Lamp data, which is shown separately)
                    // The optometrist's anterior segment is already shown above
                }

                content += '</div>';
            }

            if (selectedSections.slitLamp && detailedExamData?.slitLamp) {
                content += '<div class="section"><p class="section-title">Slit Lamp Examination</p>';
                const slit = detailedExamData.slitLamp;
                content += '<table><tr><th>Structure</th><th>Right Eye (OD)</th><th>Left Eye (OS)</th></tr>';
                content += `<tr><td>Eyelids</td><td>${slit.eyelidsOD || '-'}</td><td>${slit.eyelidsOS || '-'}</td></tr>`;
                content += `<tr><td>Conjunctiva</td><td>${slit.conjunctivaOD || '-'}</td><td>${slit.conjunctivaOS || '-'}</td></tr>`;
                content += `<tr><td>Cornea</td><td>${slit.corneaOD || '-'}</td><td>${slit.corneaOS || '-'}</td></tr>`;
                content += `<tr><td>Lens</td><td>${slit.lensOD || '-'}</td><td>${slit.lensOS || '-'}</td></tr>`;
                content += '</table></div>';
            }
        }

        // Prescription
        content += '<div class="section">';
        if (prescriptionItems && prescriptionItems.length > 0) {
            content += '<div class="section"><p class="section-title">Medicines</p>';
            content += '<table><thead><tr><th>Sr.No</th><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Duration</th><th>Qty</th><th>Instructions</th></tr></thead><tbody>';
            prescriptionItems.forEach((item, i) => {
                content += `<tr>
                    <td>${i + 1}</td>
                    <td>${item.medicineName}</td>
                    <td>${item.dosage}</td>
                    <td>${item.frequency}</td>
                    <td>${item.duration}</td>
                    <td>${item.quantity || '-'}</td>
                    <td>${item.instructions || '-'}</td>
                </tr>`;
            });
            content += '</tbody></table>';
        } else {
            content += '<p style="color: #666; font-style: italic;">No medicines prescribed</p>';
        }
        if (generalInstructions) content += `<p><strong>General Instructions:</strong> ${generalInstructions}</p>`;
        if (followUpInstructions) content += `<p><strong>Follow-up Instructions:</strong> ${followUpInstructions}</p>`;
        content += '</div>';

        // Signature block - right aligned
        if (doctorName) {
            content += `<div class="signature-block" style="page-break-inside: avoid;">
                <p style="margin: 0;"><strong>Dr. ${doctorName}</strong></p>
                <p style="margin: 2px 0; font-size: 10pt;">Insight Institute of Ophthalmology<br/>Insight Laser Centre</p>
            </div>`;
        }

        return content;
    };


    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="flex items-center">
                            <FileText className="h-5 w-5 mr-2 text-blue-600" />
                            Prescription Preview
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                            Select sections to include in the prescription document
                        </p>
                        <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">

                            <span>Note: When printing, uncheck "Headers and footers" in print settings to remove date/URL</span>
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrintPrescription}
                        className="flex items-center gap-2"
                    >
                        <Printer className="h-4 w-4" />
                        Print Prescription
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Section Selection */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-lg flex items-center">
                            <Eye className="h-5 w-5 mr-2 text-indigo-600" />
                            Select Detailed Examination Sections
                        </h3>
                        <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                            <Checkbox
                                id="select-all"
                                checked={Object.values(selectedSections).every(v => v)}
                                onCheckedChange={(checked) => {
                                    const newSections = {};
                                    detailedSections.forEach(section => {
                                        newSections[section.id] = checked;
                                    });
                                    setSelectedSections(newSections);
                                }}
                            />
                            <Label
                                htmlFor="select-all"
                                className="cursor-pointer font-medium text-blue-700"
                            >
                                Select All
                            </Label>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                        {detailedSections.map((section) => (
                            <div key={section.id} className="flex items-center space-x-3 p-3 bg-white rounded border hover:border-blue-300 transition-colors">
                                <Checkbox
                                    id={section.id}
                                    checked={selectedSections[section.id]}
                                    onCheckedChange={() => toggleSection(section.id)}
                                />
                                <Label
                                    htmlFor={section.id}
                                    className="flex items-center gap-2 cursor-pointer flex-1"
                                >
                                    <span className="text-lg">{section.icon}</span>
                                    <span className="font-medium">{section.label}</span>
                                </Label>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Always Included Sections */}
                <div>
                    <h3 className="font-semibold text-lg mb-4 flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-green-600" />
                        Always Included in Prescription
                    </h3>
                    <div className="space-y-3">
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">📝</span>
                                <h4 className="font-semibold text-green-800">My Examination & Treatment Plan</h4>
                            </div>
                            <div className="text-sm text-green-700 space-y-3 ml-7">
                                {examinationNotes && (
                                    <div>
                                        <strong>Clinical Examination Notes:</strong>
                                        <p className="mt-1 text-gray-700 whitespace-pre-wrap">{examinationNotes}</p>
                                    </div>
                                )}
                                {selectedDiagnoses && selectedDiagnoses.length > 0 && (
                                    <div>
                                        <strong>Diagnosis ({selectedDiagnoses.length}):</strong>
                                        <ul className="mt-1 list-disc list-inside">
                                            {selectedDiagnoses.map((d, i) => (
                                                <li key={i} className="text-gray-700">
                                                    {d.title?.['@value'] || d.title || d.diseaseName || d.name}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {checkedTests.length > 0 && (
                                    <div>
                                        <strong>Additional Tests Required:</strong>
                                        <ul className="mt-1 list-disc list-inside">
                                            {checkedTests.map((test, i) => (
                                                <li key={i} className="text-gray-700">{test}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {followUpRequired && (
                                    <div>
                                        <strong>Follow-up Required:</strong>
                                        <p className="mt-1 text-gray-700">
                                            {followUpPeriod && `Period: ${followUpPeriod}`}
                                            {followUpDays && ` (${followUpDays} days)`}
                                            {followUpDate && ` - Date: ${new Date(followUpDate).toLocaleDateString()}`}
                                        </p>
                                    </div>
                                )}
                                {surgerySuggested && (
                                    <div>
                                        <strong>Surgery Recommended:</strong>
                                        <p className="mt-1 text-gray-700 bg-yellow-50 border-l-4 border-yellow-400 p-2">
                                            ⚕️ {surgeryTypeName}
                                        </p>
                                    </div>
                                )}
                                {treatmentPlan && (
                                    <div>
                                        <strong>Treatment Plan:</strong>
                                        <p className="mt-1 text-gray-700 whitespace-pre-wrap">{treatmentPlan}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">💊</span>
                                <h4 className="font-semibold text-green-800">Prescription & Medications</h4>
                            </div>
                            <div className="text-sm text-green-700 space-y-2 ml-7">
                                {prescriptionItems && prescriptionItems.length > 0 ? (
                                    <div>
                                        <strong>Prescribed Medicines ({prescriptionItems.length}):</strong>
                                        <div className="mt-2 overflow-x-auto">
                                            <table className="min-w-full border border-gray-300 text-xs">
                                                <thead className="bg-gray-100">
                                                    <tr>
                                                        <th className="border border-gray-300 px-2 py-1 text-left">#</th>
                                                        <th className="border border-gray-300 px-2 py-1 text-left">Medicine</th>
                                                        <th className="border border-gray-300 px-2 py-1 text-left">Dosage</th>
                                                        <th className="border border-gray-300 px-2 py-1 text-left">Frequency</th>
                                                        <th className="border border-gray-300 px-2 py-1 text-left">Duration</th>
                                                        <th className="border border-gray-300 px-2 py-1 text-left">Qty</th>
                                                        <th className="border border-gray-300 px-2 py-1 text-left">Instructions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {prescriptionItems.map((item, i) => (
                                                        <tr key={i} className="text-gray-700">
                                                            <td className="border border-gray-300 px-2 py-1">{i + 1}</td>
                                                            <td className="border border-gray-300 px-2 py-1 font-medium">{item.medicineName}</td>
                                                            <td className="border border-gray-300 px-2 py-1">{item.dosage}</td>
                                                            <td className="border border-gray-300 px-2 py-1">{item.frequency}</td>
                                                            <td className="border border-gray-300 px-2 py-1">{item.duration}</td>
                                                            <td className="border border-gray-300 px-2 py-1">{item.quantity || '-'}</td>
                                                            <td className="border border-gray-300 px-2 py-1 text-xs">{item.instructions || '-'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-gray-500">No medicines prescribed yet</p>
                                )}
                                {generalInstructions && (
                                    <div>
                                        <strong>General Instructions:</strong>
                                        <p className="mt-1 text-gray-700">{generalInstructions}</p>
                                    </div>
                                )}
                                {/* {doctorName && (
                                    <div className="mt-3 pt-3 border-t border-green-300">
                                        <p className="text-gray-700"><strong>Prescribed by:</strong> Dr. {doctorName}</p>
                                    </div>
                                )} */}
                                {followUpInstructions && (
                                    <div>
                                        <strong>Follow-up Instructions:</strong>
                                        <p className="mt-1 text-gray-700">{followUpInstructions}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button
                        variant="outline"
                        onClick={handlePrintPrescription}
                        className="flex items-center gap-2"
                    >
                        <Printer className="h-4 w-4" />
                        Print Prescription
                    </Button>
                    {/* <Button
                        onClick={handleDownloadPrescription}
                        className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                    >
                        <Download className="h-4 w-4" />
                        Download as PDF
                    </Button> */}
                </div>
            </CardContent>
        </Card>
    );
};

export default PrescriptionPreviewTab;
