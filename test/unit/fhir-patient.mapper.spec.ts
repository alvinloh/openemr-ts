import { FhirPatientMapper } from '../../src/fhir/mappers/fhir-patient.mapper.js';

describe('FhirPatientMapper', () => {
  let mapper: FhirPatientMapper;

  const mockPatient = {
    id: 1,
    uuid: 'patient-uuid-123',
    mrn: '00000001',
    title: 'Mr.',
    firstName: 'John',
    middleName: 'Michael',
    lastName: 'Doe',
    dateOfBirth: '1985-03-15',
    sex: 'Male',
    genderIdentity: null,
    street: '456 Oak Ave',
    city: 'Springfield',
    state: 'IL',
    postalCode: '62701',
    countryCode: 'US',
    phoneHome: '555-0100',
    phoneCell: '555-0123',
    phoneWork: null,
    email: 'john@example.com',
    ssnEncrypted: null,
    driversLicenseEncrypted: null,
    race: 'White',
    ethnicity: 'Not Hispanic or Latino',
    language: 'en',
    maritalStatus: 'M',
    primaryProviderId: null,
    referringProviderId: null,
    status: 'active',
    deceasedDate: null,
    notes: null,
    createdAt: new Date('2026-03-17'),
    updatedAt: new Date('2026-03-17'),
  } as any;

  beforeEach(() => {
    mapper = new FhirPatientMapper();
  });

  it('should map resourceType to Patient', () => {
    const fhir = mapper.toFhir(mockPatient);
    expect(fhir.resourceType).toBe('Patient');
  });

  it('should map id to patient UUID', () => {
    const fhir = mapper.toFhir(mockPatient);
    expect(fhir.id).toBe('patient-uuid-123');
  });

  it('should map MRN as identifier', () => {
    const fhir = mapper.toFhir(mockPatient);
    expect(fhir.identifier).toHaveLength(1);
    expect(fhir.identifier![0].value).toBe('00000001');
  });

  it('should map name with family, given, and prefix', () => {
    const fhir = mapper.toFhir(mockPatient);
    expect(fhir.name![0].family).toBe('Doe');
    expect(fhir.name![0].given).toEqual(['John', 'Michael']);
    expect(fhir.name![0].prefix).toEqual(['Mr.']);
  });

  it('should map gender correctly', () => {
    const fhir = mapper.toFhir(mockPatient);
    expect(fhir.gender).toBe('male');
  });

  it('should map Female to female', () => {
    const fhir = mapper.toFhir({ ...mockPatient, sex: 'Female' });
    expect(fhir.gender).toBe('female');
  });

  it('should map unknown sex to unknown', () => {
    const fhir = mapper.toFhir({ ...mockPatient, sex: 'Unspecified' });
    expect(fhir.gender).toBe('unknown');
  });

  it('should map birthDate', () => {
    const fhir = mapper.toFhir(mockPatient);
    expect(fhir.birthDate).toBe('1985-03-15');
  });

  it('should map telecom with phone and email', () => {
    const fhir = mapper.toFhir(mockPatient);
    expect(fhir.telecom).toHaveLength(3); // home phone, cell, email
    expect(fhir.telecom![0]).toEqual({ system: 'phone', value: '555-0100', use: 'home' });
    expect(fhir.telecom![1]).toEqual({ system: 'phone', value: '555-0123', use: 'mobile' });
    expect(fhir.telecom![2]).toEqual({ system: 'email', value: 'john@example.com' });
  });

  it('should map address', () => {
    const fhir = mapper.toFhir(mockPatient);
    expect(fhir.address).toHaveLength(1);
    expect(fhir.address![0].line).toEqual(['456 Oak Ave']);
    expect(fhir.address![0].city).toBe('Springfield');
    expect(fhir.address![0].state).toBe('IL');
  });

  it('should set active based on status', () => {
    const fhir = mapper.toFhir(mockPatient);
    expect(fhir.active).toBe(true);
  });

  it('should set deceasedDateTime for deceased patients', () => {
    const deceased = { ...mockPatient, status: 'deceased', deceasedDate: '2026-01-01' };
    const fhir = mapper.toFhir(deceased);
    expect(fhir.deceasedDateTime).toBe('2026-01-01');
  });

  it('should include race and ethnicity as US Core extensions', () => {
    const fhir = mapper.toFhir(mockPatient);
    expect(fhir.extension).toHaveLength(2);
    expect(fhir.extension![0].url).toContain('us-core-race');
    expect(fhir.extension![1].url).toContain('us-core-ethnicity');
  });

  it('should include communication/language', () => {
    const fhir = mapper.toFhir(mockPatient);
    expect(fhir.communication).toHaveLength(1);
    expect(fhir.communication![0].language.coding![0].code).toBe('en');
  });

  it('should omit telecom when no contact info', () => {
    const noContact = {
      ...mockPatient,
      phoneHome: null, phoneCell: null, phoneWork: null, email: null,
    };
    const fhir = mapper.toFhir(noContact);
    expect(fhir.telecom).toBeUndefined();
  });

  it('should omit address when no address info', () => {
    const noAddr = {
      ...mockPatient,
      street: null, city: null, state: null, postalCode: null,
    };
    const fhir = mapper.toFhir(noAddr);
    expect(fhir.address).toBeUndefined();
  });
});
