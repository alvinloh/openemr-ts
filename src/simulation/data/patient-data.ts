export const FIRST_NAMES_MALE = [
  'James', 'Robert', 'John', 'Michael', 'David', 'William', 'Richard', 'Joseph',
  'Thomas', 'Christopher', 'Charles', 'Daniel', 'Matthew', 'Anthony', 'Mark',
  'Steven', 'Andrew', 'Paul', 'Joshua', 'Kenneth', 'Kevin', 'Brian', 'George',
  'Timothy', 'Ronald', 'Edward', 'Jason', 'Jeffrey', 'Ryan', 'Jacob',
];

export const FIRST_NAMES_FEMALE = [
  'Mary', 'Patricia', 'Jennifer', 'Linda', 'Barbara', 'Elizabeth', 'Susan',
  'Jessica', 'Sarah', 'Karen', 'Lisa', 'Nancy', 'Betty', 'Margaret', 'Sandra',
  'Ashley', 'Emily', 'Donna', 'Michelle', 'Dorothy', 'Carol', 'Amanda',
  'Melissa', 'Deborah', 'Stephanie', 'Rebecca', 'Sharon', 'Laura', 'Cynthia', 'Kathleen',
];

export const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen',
  'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera',
  'Campbell', 'Mitchell', 'Carter', 'Roberts',
];

export const STREETS = [
  '123 Main St', '456 Oak Ave', '789 Elm Blvd', '321 Pine Rd', '654 Maple Dr',
  '987 Cedar Ln', '147 Birch Way', '258 Walnut St', '369 Cherry Ave', '741 Spruce Ct',
  '852 Willow Dr', '963 Ash Pl', '159 Hickory Ln', '267 Poplar St', '378 Sycamore Ave',
];

export const CITIES_AND_STATES: [string, string, string][] = [
  ['New York', 'NY', '10001'], ['Los Angeles', 'CA', '90001'], ['Chicago', 'IL', '60601'],
  ['Houston', 'TX', '77001'], ['Phoenix', 'AZ', '85001'], ['Philadelphia', 'PA', '19101'],
  ['San Antonio', 'TX', '78201'], ['San Diego', 'CA', '92101'], ['Dallas', 'TX', '75201'],
  ['Austin', 'TX', '78701'], ['Jacksonville', 'FL', '32099'], ['San Francisco', 'CA', '94101'],
  ['Columbus', 'OH', '43085'], ['Indianapolis', 'IN', '46201'], ['Seattle', 'WA', '98101'],
  ['Denver', 'CO', '80201'], ['Boston', 'MA', '02101'], ['Nashville', 'TN', '37201'],
  ['Portland', 'OR', '97201'], ['Las Vegas', 'NV', '89101'],
];

export const RACES = ['White', 'Black or African American', 'Asian', 'American Indian', 'Other'];
export const ETHNICITIES = ['Not Hispanic or Latino', 'Hispanic or Latino'];
export const MARITAL_STATUSES = ['Single', 'Married', 'Divorced', 'Widowed', 'Separated'];

export const DIAGNOSIS_CODES: { code: string; description: string }[] = [
  { code: 'J06.9', description: 'Acute upper respiratory infection' },
  { code: 'I10', description: 'Essential hypertension' },
  { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications' },
  { code: 'M54.5', description: 'Low back pain' },
  { code: 'J20.9', description: 'Acute bronchitis, unspecified' },
  { code: 'R10.9', description: 'Unspecified abdominal pain' },
  { code: 'N39.0', description: 'Urinary tract infection' },
  { code: 'K21.0', description: 'Gastro-esophageal reflux disease' },
  { code: 'F41.1', description: 'Generalized anxiety disorder' },
  { code: 'F32.9', description: 'Major depressive disorder' },
  { code: 'E78.5', description: 'Hyperlipidemia, unspecified' },
  { code: 'J45.909', description: 'Unspecified asthma, uncomplicated' },
];

export const MEDICATIONS: { rxCode: string; name: string; dose: string; units: string; route: string; frequency: string }[] = [
  { rxCode: '197361', name: 'Lisinopril 10mg', dose: '10', units: 'mg', route: 'PO', frequency: 'QD' },
  { rxCode: '860975', name: 'Metformin 500mg', dose: '500', units: 'mg', route: 'PO', frequency: 'BID' },
  { rxCode: '197381', name: 'Atorvastatin 20mg', dose: '20', units: 'mg', route: 'PO', frequency: 'QHS' },
  { rxCode: '310798', name: 'Omeprazole 20mg', dose: '20', units: 'mg', route: 'PO', frequency: 'QD' },
  { rxCode: '312961', name: 'Amoxicillin 500mg', dose: '500', units: 'mg', route: 'PO', frequency: 'TID' },
  { rxCode: '197591', name: 'Amlodipine 5mg', dose: '5', units: 'mg', route: 'PO', frequency: 'QD' },
  { rxCode: '835829', name: 'Sertraline 50mg', dose: '50', units: 'mg', route: 'PO', frequency: 'QD' },
  { rxCode: '259543', name: 'Albuterol 90mcg Inhaler', dose: '90', units: 'mcg', route: 'INH', frequency: 'PRN' },
];
