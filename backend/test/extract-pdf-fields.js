const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

/**
 * Extract all form fields from a PDF
 * @param {string} pdfPath - Path to the PDF file
 * @returns {Promise<Object>} - Object containing field information
 */
async function extractPdfFields(pdfPath) {
    try {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`Extracting fields from: ${path.basename(pdfPath)}`);
        console.log('='.repeat(80));
        
        const pdfBuffer = fs.readFileSync(pdfPath);
        const pdfDoc = await PDFDocument.load(pdfBuffer);
        
        const form = pdfDoc.getForm();
        const fields = form.getFields();
        
        console.log(`\nTotal Form Fields Found: ${fields.length}\n`);
        
        const fieldDetails = [];
        
        fields.forEach((field, index) => {
            const fieldName = field.getName();
            const fieldType = field.constructor.name;
            
            let fieldInfo = {
                index: index + 1,
                name: fieldName,
                type: fieldType,
            };
            
            // Get additional properties based on field type
            try {
                if (fieldType === 'PDFTextField') {
                    fieldInfo.maxLength = field.getMaxLength() || 'unlimited';
                    fieldInfo.defaultValue = field.getText() || '';
                    fieldInfo.isMultiline = field.isMultiline();
                    fieldInfo.isPassword = field.isPassword();
                } else if (fieldType === 'PDFCheckBox') {
                    fieldInfo.isChecked = field.isChecked();
                } else if (fieldType === 'PDFRadioGroup') {
                    fieldInfo.options = field.getOptions();
                    fieldInfo.selected = field.getSelected();
                } else if (fieldType === 'PDFDropdown') {
                    fieldInfo.options = field.getOptions();
                    fieldInfo.selected = field.getSelected();
                } else if (fieldType === 'PDFButton') {
                    fieldInfo.note = 'Button/Signature field';
                }
                
                // Check if field is read-only
                fieldInfo.isReadOnly = field.isReadOnly();
                
            } catch (error) {
                fieldInfo.error = `Error reading properties: ${error.message}`;
            }
            
            fieldDetails.push(fieldInfo);
        });
        
        // Display fields in console
        console.log('Field Details:');
        console.log('-'.repeat(80));
        fieldDetails.forEach(field => {
            console.log(`\n${field.index}. Field Name: "${field.name}"`);
            console.log(`   Type: ${field.type}`);
            
            if (field.type === 'PDFTextField') {
                console.log(`   Max Length: ${field.maxLength}`);
                console.log(`   Multiline: ${field.isMultiline}`);
                console.log(`   Password: ${field.isPassword}`);
                if (field.defaultValue) {
                    console.log(`   Default Value: "${field.defaultValue}"`);
                }
            } else if (field.type === 'PDFCheckBox') {
                console.log(`   Checked: ${field.isChecked}`);
            } else if (field.type === 'PDFRadioGroup' || field.type === 'PDFDropdown') {
                console.log(`   Options: ${field.options ? field.options.join(', ') : 'N/A'}`);
                console.log(`   Selected: ${field.selected || 'None'}`);
            } else if (field.type === 'PDFButton') {
                console.log(`   Note: ${field.note}`);
            }
            
            console.log(`   Read Only: ${field.isReadOnly}`);
            
            if (field.error) {
                console.log(`   Error: ${field.error}`);
            }
        });
        
        return {
            pdfName: path.basename(pdfPath),
            totalFields: fields.length,
            fields: fieldDetails
        };
        
    } catch (error) {
        console.error(`Error processing PDF: ${error.message}`);
        throw error;
    }
}

/**
 * Generate field mapping template for backend integration
 */
function generateFieldMappingTemplate(extractedData) {
    console.log(`\n${'='.repeat(80)}`);
    console.log('FIELD MAPPING TEMPLATE FOR BACKEND');
    console.log('='.repeat(80));
    console.log(`\n// ${extractedData.pdfName} - Field Mapping`);
    console.log('const fieldMapping = {');
    
    extractedData.fields.forEach(field => {
        if (field.type === 'PDFTextField' || field.type === 'PDFCheckBox') {
            console.log(`  '${field.name}': '', // ${field.type}`);
        }
    });
    
    console.log('};\n');
}

/**
 * Save field data to JSON file
 */
function saveToJsonFile(extractedData, outputFileName) {
    const outputPath = path.join(__dirname, outputFileName);
    fs.writeFileSync(outputPath, JSON.stringify(extractedData, null, 2));
    console.log(`\nField data saved to: ${outputPath}`);
}

// Main execution
async function main() {
    const templatesDir = path.join(__dirname, '..', 'pdf_templates');
    
    // PDF files to process
    const pdfFiles = [
        'ansconeng_annotated.pdf',
        'ophsureng_annotated.pdf'
    ];
    
    const allExtractedData = {};
    
    for (const pdfFile of pdfFiles) {
        const pdfPath = path.join(templatesDir, pdfFile);
        
        if (!fs.existsSync(pdfPath)) {
            console.error(`PDF file not found: ${pdfPath}`);
            continue;
        }
        
        try {
            const extractedData = await extractPdfFields(pdfPath);
            const fileKey = pdfFile.replace('.pdf', '').replace('_annotated', '');
            allExtractedData[fileKey] = extractedData;
            
            // Generate field mapping template
            generateFieldMappingTemplate(extractedData);
            
            // Save individual JSON file
            saveToJsonFile(extractedData, `${fileKey}_fields.json`);
            
        } catch (error) {
            console.error(`Failed to process ${pdfFile}:`, error);
        }
    }
    
    // Save combined data
    const combinedPath = path.join(__dirname, 'all_pdf_fields.json');
    fs.writeFileSync(combinedPath, JSON.stringify(allExtractedData, null, 2));
    console.log(`\n${'='.repeat(80)}`);
    console.log(`All PDF fields data saved to: ${combinedPath}`);
    console.log('='.repeat(80));
}

// Run the script
main().catch(console.error);
