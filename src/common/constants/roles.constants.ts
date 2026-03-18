export enum Role {
  ADMIN = 'admin',
  PHYSICIAN = 'physician',
  NURSE = 'nurse',
  STAFF = 'staff',
  BILLING = 'billing',
}

export enum Resource {
  PATIENTS = 'patients',
  ENCOUNTERS = 'encounters',
  MEDICATIONS = 'medications',
  LABS = 'labs',
  APPOINTMENTS = 'appointments',
  BILLING = 'billing',
  DOCUMENTS = 'documents',
  USERS = 'users',
  ADMIN = 'admin',
}

export enum Action {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
}
