// Configuration for all register types

export const registerConfigs = {
  eto: {
    title: 'ETO Register',
    apiEndpoint: 'eto',
    exportFilename: 'ETO_Register',
    fields: [
      { key: 'date', label: 'Date', type: 'date', required: true },
      { key: 'nameOfItem', label: 'Name of Item', type: 'text', required: true },
      { key: 'batch', label: 'Batch', type: 'text' },
      { key: 'loadNo', label: 'Load No', type: 'text' },
      { key: 'chargeInTime', label: 'Charge In Time', type: 'time' },
      { key: 'switchOff', label: 'Switch Off', type: 'time' },
      { key: 'otInHrs', label: 'OT in Hrs', type: 'number', step: '0.1' },
      { key: 'indicatorSlnp', label: 'Indicator SLNP', type: 'text' },
      { key: 'biSeparate', label: 'BI Separate', type: 'text' },
      {
        key: 'yesNo',
        label: 'Y/N',
        type: 'select',
        options: [
          { value: 'Yes', label: 'Yes' },
          { value: 'No', label: 'No' }
        ]
      },
      {
        key: 'passedFailed',
        label: 'P/F',
        type: 'select',
        options: [
          { value: 'Passed', label: 'Passed' },
          { value: 'Failed', label: 'Failed' }
        ]
      },
      { key: 'integratedStnp', label: 'Integrated STNP', type: 'text' },
      { key: 'signCssd', label: 'Sign CSSD', type: 'text' },
      { key: 'signIdd', label: 'Sign IDD', type: 'text' }
    ],
    columns: [
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'nameOfItem', label: 'Name of Item' },
      { key: 'batch', label: 'Batch' },
      { key: 'loadNo', label: 'Load No' },
      { key: 'otInHrs', label: 'OT Hrs' },
      { key: 'yesNo', label: 'Y/N' },
      { key: 'passedFailed', label: 'P/F' },
      { key: 'signCssd', label: 'Sign CSSD' },
      { key: 'signIdd', label: 'Sign IDD' }
    ]
  },

  otTemperature: {
    title: 'OT Temperature Register',
    apiEndpoint: 'ot-temperature',
    exportFilename: 'OT_Temperature_Register',
    fields: [
      { key: 'date', label: 'Date', type: 'date', required: true },
      { key: 'otRoomId', label: 'OT Room', type: 'otroom-select', required: true },
      { key: 'temperature9Am', label: 'Temperature 9AM (°C)', type: 'number', step: '0.1' },
      { key: 'temperature12Pm', label: 'Temperature 12PM (°C)', type: 'number', step: '0.1' },
      { key: 'temperature3Pm', label: 'Temperature 3PM (°C)', type: 'number', step: '0.1' },
      { key: 'temperature6Pm', label: 'Temperature 6PM (°C)', type: 'number', step: '0.1' },
      { key: 'humidity9Am', label: 'Humidity 9AM (%)', type: 'number', step: '0.1' },
      { key: 'humidity12Pm', label: 'Humidity 12PM (%)', type: 'number', step: '0.1' },
      { key: 'humidity3Pm', label: 'Humidity 3PM (%)', type: 'number', step: '0.1' },
      { key: 'humidity6Pm', label: 'Humidity 6PM (%)', type: 'number', step: '0.1' },
      { key: 'pressure9Am', label: 'Pressure 9AM', type: 'number', step: '0.1' },
      { key: 'pressure12Pm', label: 'Pressure 12PM', type: 'number', step: '0.1' },
      { key: 'pressure3Pm', label: 'Pressure 3PM', type: 'number', step: '0.1' },
      { key: 'pressure6Pm', label: 'Pressure 6PM', type: 'number', step: '0.1' },
      { key: 'sign', label: 'Sign', type: 'text' }
    ],
    columns: [
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'otRoomName', label: 'OT Room' },
      { key: 'temperature9Am', label: 'Temp 9AM' },
      { key: 'temperature12Pm', label: 'Temp 12PM' },
      { key: 'temperature3Pm', label: 'Temp 3PM' },
      { key: 'temperature6Pm', label: 'Temp 6PM' },
      { key: 'humidity9Am', label: 'Humidity 9AM' },
      { key: 'pressure9Am', label: 'Pressure 9AM' },
      { key: 'sign', label: 'Sign' }
    ]
  },

  refrigeratorTemperature: {
    title: 'Refrigerator Temperature Register',
    apiEndpoint: 'refrigerator-temperature',
    exportFilename: 'Refrigerator_Temperature_Register',
    fields: [
      { key: 'date', label: 'Date', type: 'date', required: true },
      { key: 'temperature12Pm', label: 'Temperature 12PM (°C)', type: 'number', step: '0.1' },
      { key: 'temperature3Pm', label: 'Temperature 3PM (°C)', type: 'number', step: '0.1' },
      { key: 'temperature6Pm', label: 'Temperature 6PM (°C)', type: 'number', step: '0.1' },
      { key: 'sign', label: 'Sign', type: 'text' }
    ],
    columns: [
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'temperature12Pm', label: 'Temp 12PM' },
      { key: 'temperature3Pm', label: 'Temp 3PM' },
      { key: 'temperature6Pm', label: 'Temp 6PM' },
      { key: 'sign', label: 'Sign' }
    ]
  },

  otEmergencyStock: {
    title: 'OT Emergency Stock Register',
    apiEndpoint: 'ot-emergency-stock',
    exportFilename: 'OT_Emergency_Stock_Register',
    useEquipmentTable: true, // Sync with Equipment table
    registerType: 'OtEmergencyStockRegister',
    fields: [
      { key: 'name', label: 'Name of Medicine', type: 'text', required: true },
      { key: 'currentStock', label: 'Current Stock', type: 'number', min: 0, required: true },
      { key: 'manufacturer', label: 'Brand Name', type: 'text', required: true },
      { key: 'batchNumber', label: 'Batch No', type: 'text', required: true },
      { key: 'marginDate', label: 'Margin Date', type: 'date', required: true },
      { key: 'expiryDate', label: 'Expiry Date', type: 'date', required: true },
      { key: 'reorderLevel', label: 'Expected Stock', type: 'number', min: 0 },
      { key: 'unitCost', label: 'Unit Cost (₹)', type: 'number', step: '0.01', min: 0, required: true }
    ],
    columns: [
      { key: 'srNo', label: 'SR No' },
      { key: 'name', label: 'Name of Medicine' },
      { key: 'currentStock', label: 'Current Stock' },
      { key: 'reorderLevel', label: 'Expected Stock' },
      { key: 'manufacturer', label: 'Brand Name' },
      { key: 'batchNumber', label: 'Batch No' },
      { key: 'marginDate', label: 'Margin Date', type: 'date' },
      { key: 'expiryDate', label: 'Expiry Date', type: 'date' }
    ]
  },

  fridgeStockMedicines: {
    title: 'Fridge Stock Medicines Register',
    apiEndpoint: 'fridge-stock-medicines',
    exportFilename: 'Fridge_Stock_Medicines_Register',
    useEquipmentTable: true, // Sync with Equipment table
    registerType: 'FridgeStockMedicinesRegister',
    isDailyTracking: true, // Use daily calendar view with stock tracking
    fields: [
      { key: 'name', label: 'Name of Medicine', type: 'text', required: true },
      { key: 'currentStock', label: 'Current Stock', type: 'number', min: 0, required: true },
      { key: 'manufacturer', label: 'Brand Name', type: 'text' },
      { key: 'batchNumber', label: 'Batch No', type: 'text' },
      { key: 'marginDate', label: 'Margin Date', type: 'date' },
      { key: 'expiryDate', label: 'Expiry Date', type: 'date' },
      { key: 'reorderLevel', label: 'Reorder Level', type: 'number', min: 0 },
      { key: 'unitCost', label: 'Unit Cost (₹)', type: 'number', step: '0.01', min: 0, required: true }
    ],
    columns: [
      { key: 'srNo', label: 'SR No' },
      { key: 'name', label: 'Name of Medicine' },
      { key: 'currentStock', label: 'Current Stock' },
      { key: 'manufacturer', label: 'Brand Name' },
      { key: 'expiryDate', label: 'Expiry Date', type: 'date' },
      { key: 'createdAt', label: 'Entry Date', type: 'date' }
    ]
  },

  emergency: {
    title: 'Emergency Register',
    apiEndpoint: 'emergency',
    exportFilename: 'Emergency_Register',
    fields: [
      { key: 'date', label: 'Date', type: 'date', required: true },
      { key: 'time', label: 'Time', type: 'time', required: true },
      { key: 'patientName', label: 'Patient Name', type: 'text', required: true },
      { key: 'age', label: 'Age', type: 'number', required: true },
      {
        key: 'sex',
        label: 'Sex',
        type: 'select',
        required: true,
        options: [
          { value: 'Male', label: 'Male' },
          { value: 'Female', label: 'Female' },
          { value: 'Other', label: 'Other' }
        ]
      },
      { key: 'prnNo', label: 'PRN No', type: 'text' },
      { key: 'ipdNo', label: 'IPD No', type: 'text' },
      { key: 'complaints', label: 'Complaints', type: 'text' },
      { key: 'treatmentGiven', label: 'Treatment Given', type: 'text' },
      {
        key: 'mlcYesNo',
        label: 'MLC Yes/No',
        type: 'select',
        options: [
          { value: 'Yes', label: 'Yes' },
          { value: 'No', label: 'No' }
        ]
      },
      {
        key: 'mlcNo',
        label: 'If MLC Then No',
        type: 'text',
        dependsOn: { field: 'mlcYesNo', value: 'Yes' }
      },
      { key: 'doctorSign', label: 'Doctor Sign', type: 'text' },
      { key: 'staffSign', label: 'Staff Sign', type: 'text' }
    ],
    columns: [
      { key: 'srNo', label: 'SR No' },
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'time', label: 'Time' },
      { key: 'patientName', label: 'Patient Name' },
      { key: 'age', label: 'Age' },
      { key: 'sex', label: 'Sex' },
      { key: 'mlcYesNo', label: 'MLC' },
      { key: 'mlcNo', label: 'MLC No' },
      { key: 'doctorSign', label: 'Doctor Sign' },
      { key: 'staffSign', label: 'Staff Sign' }
    ]
  },

  o2N2Pressure: {
    title: 'O2 and N2 Pressure Check Register',
    apiEndpoint: 'o2-n2-pressure',
    exportFilename: 'O2_N2_Pressure_Check_Register',
    fields: [
      { key: 'date', label: 'Date', type: 'date', required: true },
      { key: 'time', label: 'Time', type: 'time', required: true },
      { key: 'o2Big', label: 'O2 Big', type: 'number', step: '0.1' },
      { key: 'o2Small', label: 'O2 Small', type: 'number', step: '0.1' },
      { key: 'n2', label: 'N2', type: 'number', step: '0.1' },
      { key: 'sign', label: 'Sign', type: 'text' },
      { key: 'remark', label: 'Remark', type: 'text' }
    ],
    columns: [
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'time', label: 'Time' },
      { key: 'o2Big', label: 'O2 Big' },
      { key: 'o2Small', label: 'O2 Small' },
      { key: 'n2', label: 'N2' },
      { key: 'sign', label: 'Sign' },
      { key: 'remark', label: 'Remark' }
    ]
  }
};