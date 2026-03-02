const { PrismaClient } = require('@prisma/client');
const ExcelJS = require('exceljs');

const prisma = new PrismaClient();

// Generic CRUD operations for all registers
const createRegisterEntry = (model) => async (req, res) => {
  try {
    const data = { ...req.body, createdBy: req.user?.id };
    
    // Auto-generate srNo if not provided and model has srNo field
    const modelsWithSrNo = ['otEmergencyStockRegister', 'emergencyRegister', 'fridgeStockMedicinesRegister'];
    if (modelsWithSrNo.includes(model) && !data.srNo) {
      const lastEntry = await prisma[model].findFirst({
        orderBy: { srNo: 'desc' },
        select: { srNo: true }
      });
      data.srNo = lastEntry ? lastEntry.srNo + 1 : 1;
    }
    
    // Auto-set entryDate to today for Fridge Stock Medicines
    if (model === 'fridgeStockMedicinesRegister' && !data.entryDate) {
      data.entryDate = new Date();
    }
    
    // Convert date fields
    if (data.date) data.date = new Date(data.date);
    if (data.marginDate) data.marginDate = new Date(data.marginDate);
    if (data.expiryDate) data.expiryDate = new Date(data.expiryDate);
    if (data.entryDate) data.entryDate = new Date(data.entryDate);
    
    // Convert numeric fields - convert empty strings to null
    ['otInHrs', 'temperature9Am', 'temperature12Pm', 'temperature3Pm', 'temperature6Pm',
     'humidity9Am', 'humidity12Pm', 'humidity3Pm', 'humidity6Pm',
     'pressure9Am', 'pressure12Pm', 'pressure3Pm', 'pressure6Pm',
     'o2Big', 'o2Small', 'n2', 'expectedStock', 'srNo', 'age'].forEach(field => {
      if (data[field] !== undefined) {
        if (data[field] === '' || data[field] === null) {
          data[field] = null;
        } else {
          data[field] = parseFloat(data[field]) || parseInt(data[field]);
        }
      }
    });

    const register = await prisma[model].create({ data });
    res.status(201).json({
      success: true,
      message: `${model} entry created successfully`,
      data: register
    });
  } catch (error) {
    console.error(`Error creating ${model}:`, error);
    res.status(500).json({
      success: false,
      message: `Failed to create ${model} entry`,
      error: error.message
    });
  }
};

const getRegisterEntries = (model) => async (req, res) => {
  try {
    const { page = 1, limit = 100, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;
    const where = {};
    
    if (startDate && endDate) {
      where.date = { gte: new Date(startDate), lte: new Date(endDate) };
    }

    // Determine order by field based on model
    const modelsWithSrNo = ['otEmergencyStockRegister', 'emergencyRegister', 'fridgeStockMedicinesRegister'];
    const orderBy = modelsWithSrNo.includes(model) ? { srNo: 'asc' } : { date: 'desc' };

    const [registers, total] = await Promise.all([
      prisma[model].findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy
      }),
      prisma[model].count({ where })
    ]);

    res.json({
      success: true,
      data: registers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error(`Error fetching ${model}:`, error);
    res.status(500).json({
      success: false,
      message: `Failed to fetch ${model} entries`,
      error: error.message
    });
  }
};

const updateRegisterEntry = (model) => async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Convert date fields
    if (updateData.date) updateData.date = new Date(updateData.date);
    if (updateData.marginDate) updateData.marginDate = new Date(updateData.marginDate);
    if (updateData.expiryDate) updateData.expiryDate = new Date(updateData.expiryDate);
    if (updateData.entryDate) updateData.entryDate = new Date(updateData.entryDate);
    
    // Convert numeric fields - convert empty strings to null
    ['otInHrs', 'temperature9Am', 'temperature12Pm', 'temperature3Pm', 'temperature6Pm',
     'humidity9Am', 'humidity12Pm', 'humidity3Pm', 'humidity6Pm',
     'pressure9Am', 'pressure12Pm', 'pressure3Pm', 'pressure6Pm',
     'o2Big', 'o2Small', 'n2', 'expectedStock', 'srNo', 'age'].forEach(field => {
      if (updateData[field] !== undefined) {
        if (updateData[field] === '' || updateData[field] === null) {
          updateData[field] = null;
        } else {
          updateData[field] = parseFloat(updateData[field]) || parseInt(updateData[field]);
        }
      }
    });

    const register = await prisma[model].update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      message: `${model} updated successfully`,
      data: register
    });
  } catch (error) {
    console.error(`Error updating ${model}:`, error);
    res.status(500).json({
      success: false,
      message: `Failed to update ${model}`,
      error: error.message
    });
  }
};

const deleteRegisterEntry = (model) => async (req, res) => {
  try {
    const { id } = req.params;
    await prisma[model].delete({ where: { id } });
    res.json({
      success: true,
      message: `${model} deleted successfully`
    });
  } catch (error) {
    console.error(`Error deleting ${model}:`, error);
    res.status(500).json({
      success: false,
      message: `Failed to delete ${model}`,
      error: error.message
    });
  }
};

// Export to Excel functionality
const exportToExcel = (model, columns, filename) => async (req, res) => {
  try {
    const { startDate, endDate, year, month, exportType } = req.query;
    
    // Handle yearly export
    if (exportType === 'yearly' && year) {
      return exportYearlyToExcel(model, columns, filename, parseInt(year), res);
    }
    
    // Handle regular export with month/year filtering
    const where = {};
    
    // If month and year are provided, filter by that specific month
    if (month && year) {
      const startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endOfMonth = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      where.date = { gte: startOfMonth, lte: endOfMonth };
    } else if (startDate && endDate) {
      // Otherwise use date range if provided
      where.date = { gte: new Date(startDate), lte: new Date(endDate) };
    }

    const data = await prisma[model].findMany({
      where,
      orderBy: { date: 'desc' }
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(filename);

    // Determine what to show in header
    let headerText = filename.replace(/_/g, ' ');
    
    // If month and year are provided, show that specific month
    if (month && year) {
      const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long' });
      headerText = `${headerText} - ${monthName} ${year}`;
    } else if (startDate && endDate) {
      // If we have date filters, show date range
      const start = new Date(startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const end = new Date(endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      headerText = `${headerText} (${start} - ${end})`;
    } else {
      // Show current month if no filters
      const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
      headerText = `${headerText} - ${currentMonth}`;
    }

    // Add register name (with month/date info) in row 1
    worksheet.mergeCells(`A1:${String.fromCharCode(64 + columns.length)}1`);
    const registerNameCell = worksheet.getCell('A1');
    registerNameCell.value = headerText;
    registerNameCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
    registerNameCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF006494' }
    };
    registerNameCell.alignment = { horizontal: 'center', vertical: 'middle' };
    registerNameCell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
    worksheet.getRow(1).height = 25;
    
    // Leave row 2 empty
    worksheet.getRow(2).height = 20;

    // Set column widths
    columns.forEach((col, index) => {
      worksheet.getColumn(index + 1).width = col.width || 15;
    });

    // Add column headers in row 3
    const headerRow = worksheet.getRow(3);
    headerRow.height = 20;
    columns.forEach((col, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = col.header;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF006494' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Add data rows starting from row 4
    data.forEach((row, rowIndex) => {
      const dataRow = worksheet.getRow(4 + rowIndex);
      dataRow.height = 20;
      
      columns.forEach((col, colIndex) => {
        const cell = dataRow.getCell(colIndex + 1);
        if (col.key === 'date' && row[col.key]) {
          cell.value = row[col.key].toISOString().split('T')[0];
        } else {
          cell.value = row[col.key] || '';
        }
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(`Error exporting ${model} to Excel:`, error);
    res.status(500).json({
      success: false,
      message: `Failed to export ${model} to Excel`,
      error: error.message
    });
  }
};

// Helper function for yearly export
const exportYearlyToExcel = async (model, columns, filename, year, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    
    // Create a sheet for each month
    for (let month = 1; month <= 12; month++) {
      const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
      const worksheet = workbook.addWorksheet(monthName);
      
      // Fetch data for this month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      
      const data = await prisma[model].findMany({
        where: {
          date: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: { date: 'asc' }
      });
      
      // Add register name and month in single row
      worksheet.mergeCells(`A1:${String.fromCharCode(64 + columns.length)}1`);
      const headerCell = worksheet.getCell('A1');
      headerCell.value = `${filename.replace(/_/g, ' ')} - ${monthName}`;
      headerCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
      headerCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF006494' }
      };
      headerCell.alignment = { horizontal: 'center', vertical: 'middle' };
      headerCell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      worksheet.getRow(1).height = 25;
      
      // Leave row 2 empty
      worksheet.getRow(2).height = 20;
      
      // Add column headers in row 3
      const headerRow = worksheet.getRow(3);
      headerRow.height = 20;
      columns.forEach((col, index) => {
        const cell = headerRow.getCell(index + 1);
        cell.value = col.header;
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF006494' }
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        worksheet.getColumn(index + 1).width = col.width || 15;
      });
      
      // Add data rows starting from row 4
      data.forEach((row, rowIndex) => {
        const dataRow = worksheet.getRow(4 + rowIndex);
        dataRow.height = 20;
        
        columns.forEach((col, colIndex) => {
          const cell = dataRow.getCell(colIndex + 1);
          if (col.key === 'date' && row[col.key]) {
            cell.value = row[col.key].toISOString().split('T')[0];
          } else {
            cell.value = row[col.key] || '';
          }
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      });
    }
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}_${year}_Yearly.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(`Error exporting yearly ${model} to Excel:`, error);
    throw error;
  }
};

// Specific controllers for each register type
const createEtoRegister = createRegisterEntry('etoRegister');
const getEtoRegisters = getRegisterEntries('etoRegister');
const updateEtoRegister = updateRegisterEntry('etoRegister');
const deleteEtoRegister = deleteRegisterEntry('etoRegister');

const createOtTemperatureRegister = createRegisterEntry('otTemperatureRegister');
const getOtTemperatureRegisters = async (req, res) => {
  try {
    const { page = 1, limit = 100, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;
    const where = {};
    
    if (startDate && endDate) {
      where.date = { gte: new Date(startDate), lte: new Date(endDate) };
    }

    const [registers, total] = await Promise.all([
      prisma.otTemperatureRegister.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { date: 'desc' },
        include: {
          otRoom: {
            select: {
              id: true,
              roomNumber: true,
              roomName: true
            }
          }
        }
      }),
      prisma.otTemperatureRegister.count({ where })
    ]);

    // Format the response to include otRoomName for display
    const formattedRegisters = registers.map(reg => ({
      ...reg,
      otRoomName: reg.otRoom ? `${reg.otRoom.roomName} (${reg.otRoom.roomNumber})` : 'N/A',
      otRoom: undefined // Remove nested object
    }));

    res.json({
      success: true,
      data: formattedRegisters,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching OT temperature registers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch OT temperature register entries',
      error: error.message
    });
  }
};
const updateOtTemperatureRegister = updateRegisterEntry('otTemperatureRegister');
const deleteOtTemperatureRegister = deleteRegisterEntry('otTemperatureRegister');

const createRefrigeratorTemperatureRegister = createRegisterEntry('refrigeratorTemperatureRegister');
const getRefrigeratorTemperatureRegisters = getRegisterEntries('refrigeratorTemperatureRegister');
const updateRefrigeratorTemperatureRegister = updateRegisterEntry('refrigeratorTemperatureRegister');
const deleteRefrigeratorTemperatureRegister = deleteRegisterEntry('refrigeratorTemperatureRegister');

const createOtEmergencyStockRegister = createRegisterEntry('otEmergencyStockRegister');
const getOtEmergencyStockRegisters = getRegisterEntries('otEmergencyStockRegister');
const updateOtEmergencyStockRegister = updateRegisterEntry('otEmergencyStockRegister');
const deleteOtEmergencyStockRegister = deleteRegisterEntry('otEmergencyStockRegister');

const createFridgeStockMedicinesRegister = createRegisterEntry('fridgeStockMedicinesRegister');
const getFridgeStockMedicinesRegisters = getRegisterEntries('fridgeStockMedicinesRegister');
const updateFridgeStockMedicinesRegister = updateRegisterEntry('fridgeStockMedicinesRegister');
const deleteFridgeStockMedicinesRegister = deleteRegisterEntry('fridgeStockMedicinesRegister');

const createEmergencyRegister = createRegisterEntry('emergencyRegister');
const getEmergencyRegisters = getRegisterEntries('emergencyRegister');
const updateEmergencyRegister = updateRegisterEntry('emergencyRegister');
const deleteEmergencyRegister = deleteRegisterEntry('emergencyRegister');

const createO2N2PressureCheckRegister = createRegisterEntry('o2N2PressureCheckRegister');
const getO2N2PressureCheckRegisters = getRegisterEntries('o2N2PressureCheckRegister');
const updateO2N2PressureCheckRegister = updateRegisterEntry('o2N2PressureCheckRegister');
const deleteO2N2PressureCheckRegister = deleteRegisterEntry('o2N2PressureCheckRegister');

// Excel export functions with column definitions
const exportEtoRegisterToExcel = exportToExcel('etoRegister', [
  { header: 'Date', key: 'date', width: 12 },
  { header: 'Name of Item', key: 'nameOfItem', width: 20 },
  { header: 'Batch', key: 'batch', width: 15 },
  { header: 'Load No', key: 'loadNo', width: 15 },
  { header: 'Charge In Time', key: 'chargeInTime', width: 15 },
  { header: 'Switch Off', key: 'switchOff', width: 15 },
  { header: 'OT in Hrs', key: 'otInHrs', width: 12 },
  { header: 'Indicator SLNP', key: 'indicatorSlnp', width: 15 },
  { header: 'BI Separate', key: 'biSeparate', width: 15 },
  { header: 'Y/N', key: 'yesNo', width: 8 },
  { header: 'P/F', key: 'passedFailed', width: 8 },
  { header: 'Integrated STNP', key: 'integratedStnp', width: 15 },
  { header: 'Sign CSSD', key: 'signCssd', width: 15 },
  { header: 'Sign IDD', key: 'signIdd', width: 15 }
], 'ETO_Register');

const exportOtTemperatureRegisterToExcel = exportToExcel('otTemperatureRegister', [
  { header: 'Date', key: 'date', width: 12 },
  { header: 'Temperature 9AM (°C)', key: 'temperature9Am', width: 18 },
  { header: 'Temperature 12PM (°C)', key: 'temperature12Pm', width: 18 },
  { header: 'Temperature 3PM (°C)', key: 'temperature3Pm', width: 18 },
  { header: 'Temperature 6PM (°C)', key: 'temperature6Pm', width: 18 },
  { header: 'Humidity 9AM (%)', key: 'humidity9Am', width: 15 },
  { header: 'Humidity 12PM (%)', key: 'humidity12Pm', width: 15 },
  { header: 'Humidity 3PM (%)', key: 'humidity3Pm', width: 15 },
  { header: 'Humidity 6PM (%)', key: 'humidity6Pm', width: 15 },
  { header: 'Pressure 9AM', key: 'pressure9Am', width: 12 },
  { header: 'Pressure 12PM', key: 'pressure12Pm', width: 12 },
  { header: 'Pressure 3PM', key: 'pressure3Pm', width: 12 },
  { header: 'Pressure 6PM', key: 'pressure6Pm', width: 12 },
  { header: 'Sign on Sunday', key: 'signOnSunday', width: 15 }
], 'OT_Temperature_Register');

const exportRefrigeratorTemperatureRegisterToExcel = exportToExcel('refrigeratorTemperatureRegister', [
  { header: 'Date', key: 'date', width: 12 },
  { header: 'Temperature 12PM (°C)', key: 'temperature12Pm', width: 18 },
  { header: 'Temperature 3PM (°C)', key: 'temperature3Pm', width: 18 },
  { header: 'Temperature 6PM (°C)', key: 'temperature6Pm', width: 18 },
  { header: 'Sign', key: 'sign', width: 15 }
], 'Refrigerator_Temperature_Register');

const exportOtEmergencyStockRegisterToExcel = async (req, res) => {
  try {
    const { month, year, exportType } = req.query;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    
    // Handle yearly export
    if (exportType === 'yearly') {
      return exportYearlyRegistersToExcel(currentYear, 'OtEmergencyStockRegister', res);
    }
    
    // Handle monthly export
    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    
    // First, get all OT Emergency medicines from Equipment table
    const medicines = await prisma.equipment.findMany({
      where: {
        category: 'Medicine',
        register: 'OtEmergencyStockRegister',
        isActive: true
      },
      orderBy: { name: 'asc' }
    });
    
    console.log(`📦 Found ${medicines.length} OT emergency medicines in Equipment table`);
    
    // Check which ones have register entries
    const existingRegisters = await prisma.equipmentStockRegister.findMany({
      where: {
        month: currentMonth,
        year: currentYear,
        equipmentId: { in: medicines.map(m => m.id) }
      }
    });
    
    console.log(`📊 Found ${existingRegisters.length} existing register entries`);
    
    // Create missing register entries
    const existingEquipmentIds = new Set(existingRegisters.map(r => r.equipmentId));
    const missingMedicines = medicines.filter(m => !existingEquipmentIds.has(m.id));
    
    if (missingMedicines.length > 0) {
      console.log(`⚠️ Creating ${missingMedicines.length} missing register entries...`);
      
      const today = new Date().getDate();
      const maxSrNo = existingRegisters.length > 0 
        ? Math.max(...existingRegisters.map(r => r.srNo)) 
        : 0;
      
      for (let i = 0; i < missingMedicines.length; i++) {
        const medicine = missingMedicines[i];
        
        await prisma.equipmentStockRegister.create({
          data: {
            srNo: maxSrNo + i + 1,
            medicineName: medicine.name,
            equipmentId: medicine.id,
            month: currentMonth,
            year: currentYear,
            dailyStock: { [today]: medicine.currentStock }
          }
        });
      }
      
      console.log(`✅ Created ${missingMedicines.length} new register entries`);
    }
    
    // Fetch all registers for export
    const registers = await prisma.equipmentStockRegister.findMany({
      where: {
        month: currentMonth,
        year: currentYear,
        equipment: {
          register: 'OtEmergencyStockRegister',
          isActive: true
        }
      },
      include: {
        equipment: {
          select: {
            register: true,
            name: true,
            currentStock: true,
            isActive: true
          }
        }
      },
      orderBy: { srNo: 'asc' }
    });
    
    console.log(`📤 Exporting ${registers.length} OT emergency register entries`);

    return exportRegistersToExcel(registers, currentMonth, currentYear, 'OtEmergencyStockRegister', res);
  } catch (error) {
    console.error('Error exporting otEmergencyStockRegister:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export otEmergencyStockRegister to Excel',
      error: error.message
    });
  }
};

const exportFridgeStockMedicinesRegisterToExcel = async (req, res) => {
  try {
    const { month, year, exportType } = req.query;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    
    // Handle yearly export
    if (exportType === 'yearly') {
      return exportYearlyRegistersToExcel(currentYear, 'FridgeStockMedicinesRegister', res);
    }
    
    // Handle monthly export
    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    
    // First, get all Fridge medicines from Equipment table
    const medicines = await prisma.equipment.findMany({
      where: {
        category: 'Medicine',
        register: 'FridgeStockMedicinesRegister',
        isActive: true
      },
      orderBy: { name: 'asc' }
    });
    
    console.log(`📦 Found ${medicines.length} fridge medicines in Equipment table`);
    
    // Check which ones have register entries
    const existingRegisters = await prisma.equipmentStockRegister.findMany({
      where: {
        month: currentMonth,
        year: currentYear,
        equipmentId: { in: medicines.map(m => m.id) }
      }
    });
    
    console.log(`📊 Found ${existingRegisters.length} existing register entries`);
    
    // Create missing register entries
    const existingEquipmentIds = new Set(existingRegisters.map(r => r.equipmentId));
    const missingMedicines = medicines.filter(m => !existingEquipmentIds.has(m.id));
    
    if (missingMedicines.length > 0) {
      console.log(`⚠️ Creating ${missingMedicines.length} missing register entries...`);
      
      const today = new Date().getDate();
      const maxSrNo = existingRegisters.length > 0 
        ? Math.max(...existingRegisters.map(r => r.srNo)) 
        : 0;
      
      for (let i = 0; i < missingMedicines.length; i++) {
        const medicine = missingMedicines[i];
        
        await prisma.equipmentStockRegister.create({
          data: {
            srNo: maxSrNo + i + 1,
            medicineName: medicine.name,
            equipmentId: medicine.id,
            month: currentMonth,
            year: currentYear,
            dailyStock: { [today]: medicine.currentStock }
          }
        });
      }
      
      console.log(`✅ Created ${missingMedicines.length} new register entries`);
    }
    
    // Fetch all registers for export
    const registers = await prisma.equipmentStockRegister.findMany({
      where: {
        month: currentMonth,
        year: currentYear,
        equipment: {
          register: 'FridgeStockMedicinesRegister',
          isActive: true
        }
      },
      include: {
        equipment: {
          select: {
            register: true,
            name: true,
            currentStock: true,
            isActive: true
          }
        }
      },
      orderBy: { srNo: 'asc' }
    });
    
    console.log(`📤 Exporting ${registers.length} fridge register entries`);

    return exportRegistersToExcel(registers, currentMonth, currentYear, 'FridgeStockMedicinesRegister', res);
  } catch (error) {
    console.error('Error exporting fridgeStockMedicinesRegister:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export fridgeStockMedicinesRegister to Excel',
      error: error.message
    });
  }
};

const exportEmergencyRegisterToExcel = exportToExcel('emergencyRegister', [
  { header: 'SR No', key: 'srNo', width: 8 },
  { header: 'Date', key: 'date', width: 12 },
  { header: 'Time', key: 'time', width: 10 },
  { header: 'Patient Name', key: 'patientName', width: 20 },
  { header: 'Age', key: 'age', width: 8 },
  { header: 'Sex', key: 'sex', width: 8 },
  { header: 'PRN No', key: 'prnNo', width: 12 },
  { header: 'IPD No', key: 'ipdNo', width: 12 },
  { header: 'Complaints', key: 'complaints', width: 25 },
  { header: 'Treatment Given', key: 'treatmentGiven', width: 25 },
  { header: 'MLC Yes/No', key: 'mlcYesNo', width: 12 },
  { header: 'MLC No', key: 'mlcNo', width: 12 },
  { header: 'Doctor Sign', key: 'doctorSign', width: 15 },
  { header: 'Staff Sign', key: 'staffSign', width: 15 }
], 'Emergency_Register');

const exportO2N2PressureCheckRegisterToExcel = exportToExcel('o2N2PressureCheckRegister', [
  { header: 'Date', key: 'date', width: 12 },
  { header: 'Time', key: 'time', width: 10 },
  { header: 'O2 Big', key: 'o2Big', width: 10 },
  { header: 'O2 Small', key: 'o2Small', width: 10 },
  { header: 'N2', key: 'n2', width: 10 },
  { header: 'Sign', key: 'sign', width: 15 },
  { header: 'Remark', key: 'remark', width: 20 }
], 'O2_N2_Pressure_Check_Register');

// Equipment Stock Register - Special handling for daily updates
const createEquipmentStockRegister = async (req, res) => {
  try {
    const { srNo, medicineName, month, year, dailyStock } = req.body;
    
    const data = {
      srNo: parseInt(srNo),
      medicineName,
      month: parseInt(month),
      year: parseInt(year),
      dailyStock: dailyStock || {},
      createdBy: req.user?.id
    };

    const register = await prisma.equipmentStockRegister.create({ data });
    res.status(201).json({
      success: true,
      message: 'Equipment stock register entry created successfully',
      data: register
    });
  } catch (error) {
    console.error('Error creating equipment stock register:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create equipment stock register entry',
      error: error.message
    });
  }
};

const getEquipmentStockRegisters = async (req, res) => {
  try {
    const { month, year, registerType } = req.query;
    const where = {};
    
    if (month) where.month = parseInt(month);
    if (year) where.year = parseInt(year);

    // If registerType is specified, filter by equipment's register field
    if (registerType) {
      where.equipment = {
        register: registerType
      };
    }

    const registers = await prisma.equipmentStockRegister.findMany({
      where,
      include: {
        equipment: {
          select: {
            id: true,
            name: true,
            currentStock: true,
            register: true
          }
        }
      },
      orderBy: { srNo: 'asc' }
    });

    res.json({
      success: true,
      data: registers
    });
  } catch (error) {
    console.error('Error fetching equipment stock registers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch equipment stock register entries',
      error: error.message
    });
  }
};

const updateEquipmentStockRegister = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    if (updateData.srNo) updateData.srNo = parseInt(updateData.srNo);
    if (updateData.month) updateData.month = parseInt(updateData.month);
    if (updateData.year) updateData.year = parseInt(updateData.year);

    const register = await prisma.equipmentStockRegister.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      message: 'Equipment stock register entry updated successfully',
      data: register
    });
  } catch (error) {
    console.error('Error updating equipment stock register:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update equipment stock register entry',
      error: error.message
    });
  }
};

const deleteEquipmentStockRegister = deleteRegisterEntry('equipmentStockRegister');

const exportEquipmentStockRegisterToExcel = async (req, res) => {
  try {
    const { month, year, registerType, exportType } = req.query;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    
    const targetRegisterType = registerType || 'EquipmentStockRegister';
    
    // Handle yearly export
    if (exportType === 'yearly') {
      return exportYearlyRegistersToExcel(currentYear, targetRegisterType, res);
    }
    
    // Handle monthly export
    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    
    // First, get all medicines from Equipment table for this register type
    const medicines = await prisma.equipment.findMany({
      where: {
        category: 'Medicine',
        register: targetRegisterType,
        isActive: true
      },
      orderBy: { name: 'asc' }
    });
    
    console.log(`📦 Found ${medicines.length} medicines in Equipment table for ${targetRegisterType}`);
    
    // Check which ones have register entries
    const existingRegisters = await prisma.equipmentStockRegister.findMany({
      where: {
        month: currentMonth,
        year: currentYear,
        equipmentId: { in: medicines.map(m => m.id) }
      }
    });
    
    console.log(`📊 Found ${existingRegisters.length} existing register entries`);
    
    // Create missing register entries
    const existingEquipmentIds = new Set(existingRegisters.map(r => r.equipmentId));
    const missingMedicines = medicines.filter(m => !existingEquipmentIds.has(m.id));
    
    if (missingMedicines.length > 0) {
      console.log(`⚠️ Creating ${missingMedicines.length} missing register entries...`);
      
      const today = new Date().getDate();
      const maxSrNo = existingRegisters.length > 0 
        ? Math.max(...existingRegisters.map(r => r.srNo)) 
        : 0;
      
      for (let i = 0; i < missingMedicines.length; i++) {
        const medicine = missingMedicines[i];
        
        await prisma.equipmentStockRegister.create({
          data: {
            srNo: maxSrNo + i + 1,
            medicineName: medicine.name,
            equipmentId: medicine.id,
            month: currentMonth,
            year: currentYear,
            dailyStock: { [today]: medicine.currentStock }
          }
        });
      }
      
      console.log(`✅ Created ${missingMedicines.length} new register entries`);
    }
    
    // Fetch all registers for export
    const registers = await prisma.equipmentStockRegister.findMany({
      where: {
        month: currentMonth,
        year: currentYear,
        equipment: {
          register: targetRegisterType,
          isActive: true
        }
      },
      include: {
        equipment: {
          select: {
            register: true,
            name: true,
            currentStock: true,
            isActive: true
          }
        }
      },
      orderBy: { srNo: 'asc' }
    });
    
    console.log(`📤 Exporting ${registers.length} register entries for ${targetRegisterType}`);

    return exportRegistersToExcel(registers, currentMonth, currentYear, targetRegisterType, res);
  } catch (error) {
    console.error('Error exporting equipment stock register:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export equipment stock register to Excel',
      error: error.message
    });
  }
};

// Helper function to export registers to Excel
const exportRegistersToExcel = async (registers, month, year, registerType, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    
    // Determine worksheet name based on register type
    let worksheetName = 'Equipment Stock Register';
    if (registerType === 'FridgeStockMedicinesRegister') {
      worksheetName = 'Fridge Stock Medicines';
    } else if (registerType === 'OtEmergencyStockRegister') {
      worksheetName = 'OT Emergency Stock';
    }
    
    const worksheet = workbook.addWorksheet(worksheetName);

    // Get days in month
    const daysInMonth = new Date(year || new Date().getFullYear(), month || new Date().getMonth() + 1, 0).getDate();
    
    // Get month name
    const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
    
    // Calculate number of columns (SR No + Medicine Name + all days)
    let totalColumns = 2; // SR No + Medicine Name
    for (let day = 1; day <= daysInMonth; day++) {
      totalColumns++;
    }
    
    // Calculate last column letter for merging
    const lastColumnLetter = totalColumns <= 26 
      ? String.fromCharCode(64 + totalColumns) 
      : String.fromCharCode(64 + Math.floor((totalColumns - 1) / 26)) + String.fromCharCode(65 + ((totalColumns - 1) % 26));
    
    // Add register name and month in single row
    worksheet.mergeCells(`A1:${lastColumnLetter}1`);
    const headerCell = worksheet.getCell('A1');
    headerCell.value = `${worksheetName} - ${monthName}`;
    headerCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
    headerCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF006494' }
    };
    headerCell.alignment = { horizontal: 'center', vertical: 'middle' };
    headerCell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
    worksheet.getRow(1).height = 25;
    
    // Leave row 2 empty
    worksheet.getRow(2).height = 20;
    
    // Set column widths
    worksheet.getColumn(1).width = 8;  // SR No
    worksheet.getColumn(2).width = 25; // Medicine Name
    for (let i = 3; i <= totalColumns; i++) {
      worksheet.getColumn(i).width = 8; // Day columns
    }
    
    // Create headers array for row 3
    const headerRow = worksheet.getRow(3);
    headerRow.height = 20;
    
    let colIndex = 1;
    // Add SR No header
    let cell = headerRow.getCell(colIndex++);
    cell.value = 'SR No';
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF006494' }
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
    
    // Add Medicine Name header
    cell = headerRow.getCell(colIndex++);
    cell.value = 'Medicine Name';
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF006494' }
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
    
    // Add day headers (all days)
    for (let day = 1; day <= daysInMonth; day++) {
      cell = headerRow.getCell(colIndex++);
      cell.value = day;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF006494' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    }

    // Add data rows starting from row 4
    registers.forEach((register, index) => {
      const dataRow = worksheet.getRow(4 + index);
      dataRow.height = 20;
      
      let colIdx = 1;
      
      // SR No
      let dataCell = dataRow.getCell(colIdx++);
      dataCell.value = index + 1;
      dataCell.alignment = { horizontal: 'center', vertical: 'middle' };
      dataCell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      
      // Medicine Name
      dataCell = dataRow.getCell(colIdx++);
      dataCell.value = register.medicineName;
      dataCell.alignment = { horizontal: 'center', vertical: 'middle' };
      dataCell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      
      // Track last known value for carry-forward
      let lastKnownValue = null;
      
      // Get today's date for comparison
      const today = new Date();
      const currentDay = today.getDate();
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();
      
      // Daily stock values
      for (let day = 1; day <= daysInMonth; day++) {
        // Get value for this day
        let value = register.dailyStock?.[day];
        
        // Check if this day is in the future
        const isFutureDate = (year > currentYear) || 
                             (year === currentYear && month > currentMonth) ||
                             (year === currentYear && month === currentMonth && day > currentDay);
        
        // Only carry forward for past/present dates, not future dates
        if (value === undefined || value === null || value === '') {
          if (!isFutureDate) {
            // For past/present dates, carry forward from last known value
            value = lastKnownValue;
          } else {
            // For future dates, leave as blank/empty
            value = '';
          }
        } else {
          // Update last known value
          lastKnownValue = value;
        }
        
        // Show blank for future dates, 0 for past dates with no value
        dataCell = dataRow.getCell(colIdx++);
        dataCell.value = value !== null && value !== undefined && value !== '' ? value : (isFutureDate ? '' : 0);
        dataCell.alignment = { horizontal: 'center', vertical: 'middle' };
        dataCell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      }
    });

    // Determine filename based on register type
    let filename = 'Equipment_Stock_Register';
    if (registerType === 'FridgeStockMedicinesRegister') {
      filename = 'Fridge_Stock_Medicines_Register';
    } else if (registerType === 'OtEmergencyStockRegister') {
      filename = 'OT_Emergency_Stock_Register';
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}_${month}_${year}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exporting registers to Excel:', error);
    throw error;
  }
};

// Helper function to export yearly registers to Excel (12 sheets, one per month)
const exportYearlyRegistersToExcel = async (year, registerType, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    
    // First, get ALL medicines for this register type (not filtered by month)
    const allMedicines = await prisma.equipment.findMany({
      where: {
        category: 'Medicine',
        register: registerType,
        isActive: true
      },
      orderBy: { name: 'asc' }
    });
    
    console.log(`📦 Found ${allMedicines.length} total medicines for ${registerType}`);
    
    // Create a sheet for each month
    for (let month = 1; month <= 12; month++) {
      const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
      const worksheet = workbook.addWorksheet(monthName);
      
      // Fetch register data for this month
      const monthRegisters = await prisma.equipmentStockRegister.findMany({
        where: {
          month: month,
          year: year,
          equipment: {
            register: registerType,
            isActive: true
          }
        },
        include: {
          equipment: {
            select: {
              id: true,
              register: true,
              name: true,
              currentStock: true,
              isActive: true
            }
          }
        },
        orderBy: { srNo: 'asc' }
      });
      
      // Create a map of equipmentId to register data
      const registerMap = new Map();
      monthRegisters.forEach(reg => {
        registerMap.set(reg.equipmentId, reg);
      });
      
      // Build registers array with all medicines
      const registers = allMedicines.map((medicine, index) => {
        const existingRegister = registerMap.get(medicine.id);
        return {
          srNo: index + 1,
          medicineName: medicine.name,
          equipmentId: medicine.id,
          dailyStock: existingRegister?.dailyStock || {}
        };
      });
      
      console.log(`📊 Month ${month} (${monthName}): ${registers.length} medicines`);
      
      // Get days in month
      const daysInMonth = new Date(year, month, 0).getDate();
      console.log(`📅 Days in ${monthName}: ${daysInMonth}`);
      
      // Calculate number of columns (all days)
      let totalColumns = 2; // SR No + Medicine Name
      for (let day = 1; day <= daysInMonth; day++) {
        totalColumns++;
      }
      
      // Calculate last column letter
      const lastColumnLetter = totalColumns <= 26 
        ? String.fromCharCode(64 + totalColumns) 
        : String.fromCharCode(64 + Math.floor((totalColumns - 1) / 26)) + String.fromCharCode(65 + ((totalColumns - 1) % 26));
      
      // Determine register name
      let registerName = 'Equipment Stock Register';
      if (registerType === 'FridgeStockMedicinesRegister') {
        registerName = 'Fridge Stock Medicines Register';
      } else if (registerType === 'OtEmergencyStockRegister') {
        registerName = 'OT Emergency Stock Register';
      }
      
      // Add register name and month in single row
      worksheet.mergeCells(`A1:${lastColumnLetter}1`);
      const headerCell = worksheet.getCell('A1');
      headerCell.value = `${registerName} - ${monthName}`;
      headerCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
      headerCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF006494' }
      };
      headerCell.alignment = { horizontal: 'center', vertical: 'middle' };
      headerCell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      worksheet.getRow(1).height = 25;
      
      // Leave row 2 empty
      worksheet.getRow(2).height = 20;
      
      // Set column widths
      worksheet.getColumn(1).width = 8;  // SR No
      worksheet.getColumn(2).width = 25; // Medicine Name
      for (let i = 3; i <= totalColumns; i++) {
        worksheet.getColumn(i).width = 8; // Day columns
      }
      
      // Create headers array for row 3
      const headerRow = worksheet.getRow(3);
      headerRow.height = 20;
      
      let colIndex = 1;
      // Add SR No header
      let cell = headerRow.getCell(colIndex++);
      cell.value = 'SR No';
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF006494' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      
      // Add Medicine Name header
      cell = headerRow.getCell(colIndex++);
      cell.value = 'Medicine Name';
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF006494' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      
      // Add day headers (all days)
      for (let day = 1; day <= daysInMonth; day++) {
        cell = headerRow.getCell(colIndex++);
        cell.value = day;
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF006494' }
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      }

      // Add data rows starting from row 4
      registers.forEach((register, index) => {
        const dataRow = worksheet.getRow(4 + index);
        dataRow.height = 20;
        
        let colIdx = 1;
        
        // SR No
        let dataCell = dataRow.getCell(colIdx++);
        dataCell.value = index + 1;
        dataCell.alignment = { horizontal: 'center', vertical: 'middle' };
        dataCell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        
        // Medicine Name
        dataCell = dataRow.getCell(colIdx++);
        dataCell.value = register.medicineName;
        dataCell.alignment = { horizontal: 'center', vertical: 'middle' };
        dataCell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        
        // Track last known value for carry-forward
        let lastKnownValue = null;
        
        // Get today's date for comparison
        const today = new Date();
        const currentDay = today.getDate();
        const currentMonth = today.getMonth() + 1;
        const currentYear = today.getFullYear();
        
        // Daily stock values
        for (let day = 1; day <= daysInMonth; day++) {
          let value = register.dailyStock?.[day];
          
          // Check if this day is in the future
          const isFutureDate = (year > currentYear) || 
                               (year === currentYear && month > currentMonth) ||
                               (year === currentYear && month === currentMonth && day > currentDay);
          
          // Only carry forward for past/present dates, not future dates
          if (value === undefined || value === null || value === '') {
            if (!isFutureDate) {
              // For past/present dates, carry forward from last known value
              value = lastKnownValue;
            } else {
              // For future dates, leave as blank/empty
              value = '';
            }
          } else {
            lastKnownValue = value;
          }
          
          dataCell = dataRow.getCell(colIdx++);
          dataCell.value = value !== null && value !== undefined && value !== '' ? value : (isFutureDate ? '' : 0);
          dataCell.alignment = { horizontal: 'center', vertical: 'middle' };
          dataCell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        }
      });
    }
    
    // Determine filename based on register type
    let filename = 'Equipment_Stock_Register';
    if (registerType === 'FridgeStockMedicinesRegister') {
      filename = 'Fridge_Stock_Medicines_Register';
    } else if (registerType === 'OtEmergencyStockRegister') {
      filename = 'OT_Emergency_Stock_Register';
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}_${year}_Yearly.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exporting yearly registers to Excel:', error);
    throw error;
  }
};

module.exports = {
  // ETO Register
  createEtoRegister, getEtoRegisters, updateEtoRegister, deleteEtoRegister, exportEtoRegisterToExcel,
  // OT Temperature Register
  createOtTemperatureRegister, getOtTemperatureRegisters, updateOtTemperatureRegister, deleteOtTemperatureRegister, exportOtTemperatureRegisterToExcel,
  // Refrigerator Temperature Register
  createRefrigeratorTemperatureRegister, getRefrigeratorTemperatureRegisters, updateRefrigeratorTemperatureRegister, deleteRefrigeratorTemperatureRegister, exportRefrigeratorTemperatureRegisterToExcel,
  // OT Emergency Stock Register
  createOtEmergencyStockRegister, getOtEmergencyStockRegisters, updateOtEmergencyStockRegister, deleteOtEmergencyStockRegister, exportOtEmergencyStockRegisterToExcel,
  // Fridge Stock Medicines Register
  createFridgeStockMedicinesRegister, getFridgeStockMedicinesRegisters, updateFridgeStockMedicinesRegister, deleteFridgeStockMedicinesRegister, exportFridgeStockMedicinesRegisterToExcel,
  // Emergency Register
  createEmergencyRegister, getEmergencyRegisters, updateEmergencyRegister, deleteEmergencyRegister, exportEmergencyRegisterToExcel,
  // O2 N2 Pressure Check Register
  createO2N2PressureCheckRegister, getO2N2PressureCheckRegisters, updateO2N2PressureCheckRegister, deleteO2N2PressureCheckRegister, exportO2N2PressureCheckRegisterToExcel,
  // Equipment Stock Register
  createEquipmentStockRegister, getEquipmentStockRegisters, updateEquipmentStockRegister, deleteEquipmentStockRegister, exportEquipmentStockRegisterToExcel
};