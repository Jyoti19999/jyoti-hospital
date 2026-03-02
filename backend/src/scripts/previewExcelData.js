const XLSX = require('xlsx');
const path = require('path');

function previewExcelData() {
    try {
        console.log('📂 Reading Excel file...\n');

        // Read Excel file
        const excelPath = path.join(__dirname, '../../../data/main.xlsx');
        const workbook = XLSX.readFile(excelPath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log(`✅ Successfully loaded Excel file`);
        console.log(`📊 Sheet Name: ${sheetName}`);
        console.log(`📊 Total Rows: ${data.length}\n`);

        // Show column names
        if (data.length > 0) {
            console.log('📋 Column Names:');
            Object.keys(data[0]).forEach((col, index) => {
                console.log(`   ${index + 1}. ${col}`);
            });
            console.log('');
        }

        // Show first 10 rows
        console.log('📄 First 10 Rows Preview:\n');
        data.slice(0, 10).forEach((row, index) => {
            const icdCode = row.ID || row.id || row.Code || row.code || 'N/A';
            const diseaseTitle = row.Disease || row.disease || row.Title || row.title || 'N/A';
            console.log(`${index + 1}. ${icdCode} - ${diseaseTitle}`);
        });

        console.log('\n📊 Summary:');
        console.log(`   Total records to import: ${data.length}`);
        console.log(`   Estimated processing time: ${Math.ceil(data.length / 5)} seconds`);
        
        // Check for missing data
        let missingCount = 0;
        data.forEach(row => {
            const icdCode = row.ID || row.id || row.Code || row.code;
            const diseaseTitle = row.Disease || row.disease || row.Title || row.title;
            if (!icdCode || !diseaseTitle) {
                missingCount++;
            }
        });

        if (missingCount > 0) {
            console.log(`\n⚠️  Warning: ${missingCount} rows have missing ID or Disease data`);
        } else {
            console.log(`\n✅ All rows have valid ID and Disease data`);
        }

        console.log('\n💡 To start seeding, run:');
        console.log('   npm run seed:diagnosis');

    } catch (error) {
        console.error('❌ Error reading Excel file:', error.message);
        console.error('\n💡 Make sure:');
        console.error('   1. The file exists at: data/main.xlsx');
        console.error('   2. The file is a valid Excel file (.xlsx)');
        console.error('   3. You have read permissions for the file');
    }
}

// Run the preview
previewExcelData();
