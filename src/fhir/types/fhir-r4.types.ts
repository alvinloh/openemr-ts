// Minimal FHIR R4 type definitions for our resources
// For full types, install @types/fhir

export interface FhirResource {
  resourceType: string;
  id?: string;
  meta?: {
    versionId?: string;
    lastUpdated?: string;
  };
}

export interface FhirBundle {
  resourceType: 'Bundle';
  type: 'searchset' | 'batch' | 'transaction';
  total?: number;
  entry?: Array<{
    fullUrl?: string;
    resource: FhirResource;
    search?: { mode: 'match' | 'include' };
  }>;
  link?: Array<{
    relation: string;
    url: string;
  }>;
}

export interface FhirPatient extends FhirResource {
  resourceType: 'Patient';
  identifier?: Array<{ system?: string; value?: string }>;
  active?: boolean;
  name?: Array<{
    use?: string;
    family?: string;
    given?: string[];
    prefix?: string[];
  }>;
  telecom?: Array<{ system?: string; value?: string; use?: string }>;
  gender?: string;
  birthDate?: string;
  deceasedBoolean?: boolean;
  deceasedDateTime?: string;
  address?: Array<{
    use?: string;
    line?: string[];
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  }>;
  maritalStatus?: { coding?: Array<{ system?: string; code?: string; display?: string }> };
  communication?: Array<{
    language: { coding?: Array<{ system?: string; code?: string }> };
  }>;
  extension?: Array<{ url: string; valueCode?: string; valueCoding?: any; extension?: any[] }>;
}

export interface FhirEncounter extends FhirResource {
  resourceType: 'Encounter';
  status: string;
  class: { system?: string; code?: string; display?: string };
  type?: Array<{ coding?: Array<{ system?: string; code?: string; display?: string }> }>;
  subject?: { reference?: string };
  participant?: Array<{
    individual?: { reference?: string };
    period?: { start?: string; end?: string };
  }>;
  period?: { start?: string; end?: string };
  reasonCode?: Array<{ coding?: Array<any>; text?: string }>;
  diagnosis?: Array<{
    condition: { reference?: string };
    use?: { coding?: Array<any> };
    rank?: number;
  }>;
}

export interface FhirObservation extends FhirResource {
  resourceType: 'Observation';
  status: string;
  category?: Array<{ coding?: Array<{ system?: string; code?: string; display?: string }> }>;
  code: { coding?: Array<{ system?: string; code?: string; display?: string }>; text?: string };
  subject?: { reference?: string };
  encounter?: { reference?: string };
  effectiveDateTime?: string;
  valueQuantity?: { value?: number; unit?: string; system?: string; code?: string };
  valueString?: string;
  interpretation?: Array<{ coding?: Array<{ system?: string; code?: string }> }>;
  referenceRange?: Array<{ low?: any; high?: any; text?: string }>;
}

export interface FhirMedicationRequest extends FhirResource {
  resourceType: 'MedicationRequest';
  status: string;
  intent: string;
  medicationCodeableConcept?: { coding?: Array<{ system?: string; code?: string; display?: string }>; text?: string };
  subject?: { reference?: string };
  encounter?: { reference?: string };
  requester?: { reference?: string };
  dosageInstruction?: Array<{
    text?: string;
    timing?: { code?: { text?: string } };
    route?: { coding?: Array<any>; text?: string };
    doseAndRate?: Array<{ doseQuantity?: { value?: number; unit?: string } }>;
  }>;
  dispenseRequest?: { numberOfRepeatsAllowed?: number; quantity?: { value?: number; unit?: string } };
}

export interface FhirAppointment extends FhirResource {
  resourceType: 'Appointment';
  status: string;
  start?: string;
  end?: string;
  minutesDuration?: number;
  description?: string;
  participant?: Array<{
    actor?: { reference?: string; display?: string };
    status: string;
  }>;
}

export interface FhirCondition extends FhirResource {
  resourceType: 'Condition';
  clinicalStatus?: { coding?: Array<{ system?: string; code?: string }> };
  code?: { coding?: Array<{ system?: string; code?: string; display?: string }>; text?: string };
  subject?: { reference?: string };
  onsetDateTime?: string;
  abatementDateTime?: string;
}

export interface FhirAllergyIntolerance extends FhirResource {
  resourceType: 'AllergyIntolerance';
  clinicalStatus?: { coding?: Array<{ system?: string; code?: string }> };
  type?: string;
  code?: { coding?: Array<{ system?: string; code?: string; display?: string }>; text?: string };
  patient?: { reference?: string };
  onsetDateTime?: string;
  reaction?: Array<{
    manifestation?: Array<{ coding?: Array<any>; text?: string }>;
    severity?: string;
  }>;
}

export interface FhirDocumentReference extends FhirResource {
  resourceType: 'DocumentReference';
  status: string;
  type?: { coding?: Array<{ system?: string; code?: string; display?: string }> };
  subject?: { reference?: string };
  date?: string;
  content?: Array<{
    attachment?: { contentType?: string; url?: string; title?: string; size?: number };
  }>;
  context?: { encounter?: Array<{ reference?: string }> };
}

export interface FhirCapabilityStatement extends FhirResource {
  resourceType: 'CapabilityStatement';
  status: string;
  kind: string;
  fhirVersion: string;
  format: string[];
  rest: Array<{
    mode: string;
    resource: Array<{
      type: string;
      interaction: Array<{ code: string }>;
      searchParam?: Array<{ name: string; type: string }>;
    }>;
  }>;
}
