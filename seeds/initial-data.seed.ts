import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

export async function seed(dataSource: DataSource): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();

  // Check if admin user exists
  const existing = await queryRunner.query(
    `SELECT id FROM users WHERE username = 'admin'`,
  );
  if (existing.length > 0) {
    console.log('Seed data already exists, skipping.');
    return;
  }

  console.log('Seeding initial data...');

  // Admin user
  const passwordHash = await bcrypt.hash('admin', 10);
  await queryRunner.query(
    `INSERT INTO users (uuid, username, passwordHash, firstName, lastName, role, active, email)
     VALUES (?, 'admin', ?, 'System', 'Administrator', 'admin', true, 'admin@openemr-ts.local')`,
    [uuidv4(), passwordHash],
  );

  // Default facility
  await queryRunner.query(
    `INSERT INTO facilities (uuid, name, street, city, state, postalCode, billingFacility, active)
     VALUES (?, 'Default Clinic', '123 Main St', 'Anytown', 'CA', '90210', true, true)`,
    [uuidv4()],
  );

  // Appointment categories
  const categories = [
    ['Office Visit', 30, '#3788d8'],
    ['Follow-up', 15, '#28a745'],
    ['Physical Exam', 60, '#6f42c1'],
    ['Urgent', 30, '#dc3545'],
    ['Telehealth', 20, '#17a2b8'],
  ];
  for (const [name, duration, color] of categories) {
    await queryRunner.query(
      `INSERT INTO appointment_categories (name, duration, color, active)
       VALUES (?, ?, ?, true)`,
      [name, duration, color],
    );
  }

  // Document categories
  const docCategories = [
    'Lab Results',
    'Imaging',
    'Referral',
    'Consent',
    'Insurance',
    'DICOM',
    'Other',
  ];
  for (const name of docCategories) {
    await queryRunner.query(
      `INSERT INTO document_categories (name, active) VALUES (?, true)`,
      [name],
    );
  }

  // Role permissions
  const permissions = [
    // Admin gets everything
    ...['patients', 'encounters', 'medications', 'labs', 'appointments', 'billing', 'documents', 'users', 'admin'].flatMap(
      (resource) =>
        ['create', 'read', 'update', 'delete'].map((action) => [
          'admin',
          resource,
          action,
        ]),
    ),
    // Physician
    ...['patients', 'encounters', 'medications', 'labs', 'appointments', 'documents'].flatMap(
      (resource) =>
        ['create', 'read', 'update'].map((action) => [
          'physician',
          resource,
          action,
        ]),
    ),
    // Nurse
    ...['patients', 'encounters', 'medications', 'labs', 'appointments', 'documents'].flatMap(
      (resource) => ['read'].map((action) => ['nurse', resource, action]),
    ),
    ['nurse', 'patients', 'update'],
    ['nurse', 'encounters', 'create'],
    ['nurse', 'appointments', 'create'],
    // Staff
    ...['patients', 'appointments'].flatMap((resource) =>
      ['create', 'read', 'update'].map((action) => ['staff', resource, action]),
    ),
    ['staff', 'documents', 'read'],
    ['staff', 'documents', 'create'],
    // Billing
    ...['billing', 'patients'].flatMap((resource) =>
      ['read'].map((action) => ['billing', resource, action]),
    ),
    ['billing', 'billing', 'create'],
    ['billing', 'billing', 'update'],
  ];

  for (const [role, resource, action] of permissions) {
    await queryRunner.query(
      `INSERT INTO role_permissions (role, resource, action) VALUES (?, ?, ?)`,
      [role, resource, action],
    );
  }

  console.log('Seed data created successfully.');
}
