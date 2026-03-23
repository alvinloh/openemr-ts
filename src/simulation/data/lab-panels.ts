export interface LabPanelDefinition {
  name: string;
  code: string;
  tests: {
    code: string;
    name: string;
    unit: string;
    referenceRange: string;
    min: number;
    max: number;
    abnormalLow?: number;
    abnormalHigh?: number;
  }[];
}

export const LAB_PANELS: LabPanelDefinition[] = [
  {
    name: 'Complete Blood Count',
    code: 'CBC',
    tests: [
      { code: 'WBC', name: 'White Blood Cell Count', unit: 'K/uL', referenceRange: '4.5-11.0', min: 3.0, max: 15.0, abnormalLow: 4.5, abnormalHigh: 11.0 },
      { code: 'RBC', name: 'Red Blood Cell Count', unit: 'M/uL', referenceRange: '4.5-5.5', min: 3.5, max: 6.5, abnormalLow: 4.5, abnormalHigh: 5.5 },
      { code: 'HGB', name: 'Hemoglobin', unit: 'g/dL', referenceRange: '12.0-17.5', min: 8.0, max: 20.0, abnormalLow: 12.0, abnormalHigh: 17.5 },
      { code: 'HCT', name: 'Hematocrit', unit: '%', referenceRange: '36-50', min: 28, max: 58, abnormalLow: 36, abnormalHigh: 50 },
      { code: 'PLT', name: 'Platelet Count', unit: 'K/uL', referenceRange: '150-400', min: 100, max: 500, abnormalLow: 150, abnormalHigh: 400 },
    ],
  },
  {
    name: 'Basic Metabolic Panel',
    code: 'BMP',
    tests: [
      { code: 'GLU', name: 'Glucose', unit: 'mg/dL', referenceRange: '70-100', min: 55, max: 250, abnormalLow: 70, abnormalHigh: 100 },
      { code: 'BUN', name: 'Blood Urea Nitrogen', unit: 'mg/dL', referenceRange: '7-20', min: 3, max: 40, abnormalLow: 7, abnormalHigh: 20 },
      { code: 'CRE', name: 'Creatinine', unit: 'mg/dL', referenceRange: '0.7-1.3', min: 0.4, max: 3.0, abnormalLow: 0.7, abnormalHigh: 1.3 },
      { code: 'NA', name: 'Sodium', unit: 'mEq/L', referenceRange: '136-145', min: 130, max: 150, abnormalLow: 136, abnormalHigh: 145 },
      { code: 'K', name: 'Potassium', unit: 'mEq/L', referenceRange: '3.5-5.0', min: 2.8, max: 6.0, abnormalLow: 3.5, abnormalHigh: 5.0 },
      { code: 'CL', name: 'Chloride', unit: 'mEq/L', referenceRange: '98-106', min: 90, max: 115, abnormalLow: 98, abnormalHigh: 106 },
      { code: 'CO2', name: 'Carbon Dioxide', unit: 'mEq/L', referenceRange: '23-29', min: 18, max: 35, abnormalLow: 23, abnormalHigh: 29 },
      { code: 'CA', name: 'Calcium', unit: 'mg/dL', referenceRange: '8.5-10.5', min: 7.0, max: 12.0, abnormalLow: 8.5, abnormalHigh: 10.5 },
    ],
  },
  {
    name: 'Comprehensive Metabolic Panel',
    code: 'CMP',
    tests: [
      { code: 'GLU', name: 'Glucose', unit: 'mg/dL', referenceRange: '70-100', min: 55, max: 250, abnormalLow: 70, abnormalHigh: 100 },
      { code: 'BUN', name: 'Blood Urea Nitrogen', unit: 'mg/dL', referenceRange: '7-20', min: 3, max: 40, abnormalLow: 7, abnormalHigh: 20 },
      { code: 'CRE', name: 'Creatinine', unit: 'mg/dL', referenceRange: '0.7-1.3', min: 0.4, max: 3.0, abnormalLow: 0.7, abnormalHigh: 1.3 },
      { code: 'ALT', name: 'Alanine Aminotransferase', unit: 'U/L', referenceRange: '7-56', min: 5, max: 120, abnormalLow: 7, abnormalHigh: 56 },
      { code: 'AST', name: 'Aspartate Aminotransferase', unit: 'U/L', referenceRange: '10-40', min: 5, max: 100, abnormalLow: 10, abnormalHigh: 40 },
      { code: 'ALP', name: 'Alkaline Phosphatase', unit: 'U/L', referenceRange: '44-147', min: 30, max: 200, abnormalLow: 44, abnormalHigh: 147 },
      { code: 'TBIL', name: 'Total Bilirubin', unit: 'mg/dL', referenceRange: '0.1-1.2', min: 0.1, max: 3.0, abnormalLow: 0.1, abnormalHigh: 1.2 },
      { code: 'ALB', name: 'Albumin', unit: 'g/dL', referenceRange: '3.5-5.5', min: 2.0, max: 6.0, abnormalLow: 3.5, abnormalHigh: 5.5 },
      { code: 'TP', name: 'Total Protein', unit: 'g/dL', referenceRange: '6.0-8.3', min: 4.0, max: 10.0, abnormalLow: 6.0, abnormalHigh: 8.3 },
    ],
  },
  {
    name: 'Lipid Panel',
    code: 'LIPID',
    tests: [
      { code: 'CHOL', name: 'Total Cholesterol', unit: 'mg/dL', referenceRange: '<200', min: 120, max: 320, abnormalHigh: 200 },
      { code: 'TRIG', name: 'Triglycerides', unit: 'mg/dL', referenceRange: '<150', min: 40, max: 400, abnormalHigh: 150 },
      { code: 'HDL', name: 'HDL Cholesterol', unit: 'mg/dL', referenceRange: '>40', min: 25, max: 90, abnormalLow: 40 },
      { code: 'LDL', name: 'LDL Cholesterol', unit: 'mg/dL', referenceRange: '<100', min: 40, max: 250, abnormalHigh: 100 },
    ],
  },
];
