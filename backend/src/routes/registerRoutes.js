const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/registerController');

const { authenticateToken, requireStaff } = require('../middleware/auth');

// ETO Register Routes
router.post('/eto', authenticateToken, requireStaff, createEtoRegister);
router.get('/eto', authenticateToken, requireStaff, getEtoRegisters);
router.put('/eto/:id', authenticateToken, requireStaff, updateEtoRegister);
router.delete('/eto/:id', authenticateToken, requireStaff, deleteEtoRegister);
router.get('/eto/export', authenticateToken, requireStaff, exportEtoRegisterToExcel);

// OT Temperature Register Routes
router.post('/ot-temperature', authenticateToken, requireStaff, createOtTemperatureRegister);
router.get('/ot-temperature', authenticateToken, requireStaff, getOtTemperatureRegisters);
router.put('/ot-temperature/:id', authenticateToken, requireStaff, updateOtTemperatureRegister);
router.delete('/ot-temperature/:id', authenticateToken, requireStaff, deleteOtTemperatureRegister);
router.get('/ot-temperature/export', authenticateToken, requireStaff, exportOtTemperatureRegisterToExcel);

// Refrigerator Temperature Register Routes
router.post('/refrigerator-temperature', authenticateToken, requireStaff, createRefrigeratorTemperatureRegister);
router.get('/refrigerator-temperature', authenticateToken, requireStaff, getRefrigeratorTemperatureRegisters);
router.put('/refrigerator-temperature/:id', authenticateToken, requireStaff, updateRefrigeratorTemperatureRegister);
router.delete('/refrigerator-temperature/:id', authenticateToken, requireStaff, deleteRefrigeratorTemperatureRegister);
router.get('/refrigerator-temperature/export', authenticateToken, requireStaff, exportRefrigeratorTemperatureRegisterToExcel);

// OT Emergency Stock Register Routes
router.post('/ot-emergency-stock', authenticateToken, requireStaff, createOtEmergencyStockRegister);
router.get('/ot-emergency-stock', authenticateToken, requireStaff, getOtEmergencyStockRegisters);
router.put('/ot-emergency-stock/:id', authenticateToken, requireStaff, updateOtEmergencyStockRegister);
router.delete('/ot-emergency-stock/:id', authenticateToken, requireStaff, deleteOtEmergencyStockRegister);
router.get('/ot-emergency-stock/export', authenticateToken, requireStaff, exportOtEmergencyStockRegisterToExcel);

// Fridge Stock Medicines Register Routes
router.post('/fridge-stock-medicines', authenticateToken, requireStaff, createFridgeStockMedicinesRegister);
router.get('/fridge-stock-medicines', authenticateToken, requireStaff, getFridgeStockMedicinesRegisters);
router.put('/fridge-stock-medicines/:id', authenticateToken, requireStaff, updateFridgeStockMedicinesRegister);
router.delete('/fridge-stock-medicines/:id', authenticateToken, requireStaff, deleteFridgeStockMedicinesRegister);
router.get('/fridge-stock-medicines/export', authenticateToken, requireStaff, exportFridgeStockMedicinesRegisterToExcel);

// Emergency Register Routes
router.post('/emergency', authenticateToken, requireStaff, createEmergencyRegister);
router.get('/emergency', authenticateToken, requireStaff, getEmergencyRegisters);
router.put('/emergency/:id', authenticateToken, requireStaff, updateEmergencyRegister);
router.delete('/emergency/:id', authenticateToken, requireStaff, deleteEmergencyRegister);
router.get('/emergency/export', authenticateToken, requireStaff, exportEmergencyRegisterToExcel);

// O2 N2 Pressure Check Register Routes
router.post('/o2-n2-pressure', authenticateToken, requireStaff, createO2N2PressureCheckRegister);
router.get('/o2-n2-pressure', authenticateToken, requireStaff, getO2N2PressureCheckRegisters);
router.put('/o2-n2-pressure/:id', authenticateToken, requireStaff, updateO2N2PressureCheckRegister);
router.delete('/o2-n2-pressure/:id', authenticateToken, requireStaff, deleteO2N2PressureCheckRegister);
router.get('/o2-n2-pressure/export', authenticateToken, requireStaff, exportO2N2PressureCheckRegisterToExcel);

// Equipment Stock Register Routes
router.post('/equipment-stock', authenticateToken, requireStaff, createEquipmentStockRegister);
router.get('/equipment-stock', authenticateToken, requireStaff, getEquipmentStockRegisters);
router.put('/equipment-stock/:id', authenticateToken, requireStaff, updateEquipmentStockRegister);
router.delete('/equipment-stock/:id', authenticateToken, requireStaff, deleteEquipmentStockRegister);
router.get('/equipment-stock/export', authenticateToken, requireStaff, exportEquipmentStockRegisterToExcel);

module.exports = router;