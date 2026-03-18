import { Injectable } from '@nestjs/common';
import { Patient } from '../../patient/entities/patient.entity.js';
import { FhirPatient } from '../types/fhir-r4.types.js';

@Injectable()
export class FhirPatientMapper {
  toFhir(patient: Patient): FhirPatient {
    const resource: FhirPatient = {
      resourceType: 'Patient',
      id: patient.uuid,
      meta: { lastUpdated: patient.updatedAt?.toISOString() },
      identifier: [
        { system: 'urn:oid:openemr-ts:mrn', value: patient.mrn },
      ],
      active: patient.status === 'active',
      name: [
        {
          use: 'official',
          family: patient.lastName,
          given: [patient.firstName, patient.middleName].filter(Boolean) as string[],
          prefix: patient.title ? [patient.title] : undefined,
        },
      ],
      gender: this.mapGender(patient.sex),
      birthDate: patient.dateOfBirth,
    };

    // Telecom
    const telecom: FhirPatient['telecom'] = [];
    if (patient.phoneHome) telecom.push({ system: 'phone', value: patient.phoneHome, use: 'home' });
    if (patient.phoneCell) telecom.push({ system: 'phone', value: patient.phoneCell, use: 'mobile' });
    if (patient.phoneWork) telecom.push({ system: 'phone', value: patient.phoneWork, use: 'work' });
    if (patient.email) telecom.push({ system: 'email', value: patient.email });
    if (telecom.length) resource.telecom = telecom;

    // Address
    if (patient.street || patient.city || patient.state || patient.postalCode) {
      resource.address = [
        {
          use: 'home',
          line: patient.street ? [patient.street] : undefined,
          city: patient.city || undefined,
          state: patient.state || undefined,
          postalCode: patient.postalCode || undefined,
          country: patient.countryCode || undefined,
        },
      ];
    }

    // Deceased
    if (patient.status === 'deceased' && patient.deceasedDate) {
      resource.deceasedDateTime = patient.deceasedDate;
    } else if (patient.status === 'deceased') {
      resource.deceasedBoolean = true;
    }

    // Marital status
    if (patient.maritalStatus) {
      resource.maritalStatus = {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v3-MaritalStatus',
          code: patient.maritalStatus,
        }],
      };
    }

    // Communication / language
    if (patient.language) {
      resource.communication = [{
        language: {
          coding: [{ system: 'urn:ietf:bcp:47', code: patient.language }],
        },
      }];
    }

    // Race and ethnicity as US Core extensions
    const extensions: FhirPatient['extension'] = [];
    if (patient.race) {
      extensions.push({
        url: 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-race',
        extension: [{ url: 'text', valueCode: patient.race }],
      });
    }
    if (patient.ethnicity) {
      extensions.push({
        url: 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethnicity',
        extension: [{ url: 'text', valueCode: patient.ethnicity }],
      });
    }
    if (extensions.length) resource.extension = extensions;

    return resource;
  }

  private mapGender(sex: string): string {
    switch (sex?.toLowerCase()) {
      case 'male': return 'male';
      case 'female': return 'female';
      case 'other': return 'other';
      default: return 'unknown';
    }
  }
}
